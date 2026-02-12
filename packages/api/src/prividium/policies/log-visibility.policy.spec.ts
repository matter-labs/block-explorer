import { Brackets, SelectQueryBuilder } from "typeorm";
import { mock } from "jest-mock-extended";

import { Log } from "../../log/log.entity";
import { RuleBasedLogVisibilityPolicy, NoopLogVisibilityPolicy } from "./log-visibility.policy";
import { PrividiumRulesService, EventPermissionRule } from "../prividium-rules.service";
import { zeroPadValue } from "ethers";
import { UserWithRoles } from "../../api/pipes/addUserRoles.pipe";

describe("LogVisibilityPolicy", () => {
  describe("NoopLogVisibilityPolicy", () => {
    it("does nothing", async () => {
      const qb = mock<SelectQueryBuilder<Log>>();
      const policy = new NoopLogVisibilityPolicy();
      await policy.apply(qb as any);
      expect(qb.innerJoin).not.toHaveBeenCalled();
      expect(qb.andWhere).not.toHaveBeenCalled();
    });
  });

  describe("RuleBasedLogVisibilityPolicy", () => {
    const visibleUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const contractAddr = "0xabc";
    const selectorFoo = "0xdead";
    const mockRules = [
      {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: null,
        topic2: null,
        topic3: null,
      },
    ];

    let qb: ReturnType<typeof mock<SelectQueryBuilder<Log>>>;
    let rulesService: jest.Mocked<PrividiumRulesService>;
    let policy: RuleBasedLogVisibilityPolicy;

    beforeEach(() => {
      qb = mock<SelectQueryBuilder<Log>>();
      rulesService = {
        fetchEventPermissionRules: jest.fn().mockResolvedValue(mockRules),
      } as unknown as jest.Mocked<PrividiumRulesService>;
      policy = new RuleBasedLogVisibilityPolicy(rulesService);
    });

    const makeUser = (overrides: Partial<UserWithRoles> = {}): UserWithRoles => ({
      address: visibleUser,
      token: "token1",
      roles: [],
      isAdmin: false,
      ...overrides,
    });

    it("skips when admin", async () => {
      await policy.apply(qb, { user: makeUser({ isAdmin: true }) });
      expect(qb.innerJoin).not.toHaveBeenCalled();
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(rulesService.fetchEventPermissionRules).not.toHaveBeenCalled();
    });

    it("applies visibleBy when userAddress present", async () => {
      await policy.apply(qb, { user: makeUser({ token: "" }) });
      expect(qb.innerJoin).toHaveBeenCalledWith("log.transaction", "transactions");
      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
    });

    it("fetches and applies permission rules when token present", async () => {
      await policy.apply(qb, { user: makeUser({ token: "token1" }) });
      expect(rulesService.fetchEventPermissionRules).toHaveBeenCalledWith("token1");
      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
    });

    it("short-circuits to FALSE when rules empty", async () => {
      rulesService.fetchEventPermissionRules.mockResolvedValue([]);
      await policy.apply(qb, { user: makeUser({ token: "token1" }) });
      expect(qb.andWhere).toHaveBeenCalledWith("FALSE");
    });

    it("pads userAddress for userAddress rule", async () => {
      const rule: EventPermissionRule = {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: { type: "userAddress" },
        topic2: null,
        topic3: null,
      };
      rulesService.fetchEventPermissionRules.mockResolvedValue([rule]);
      const spy = jest.spyOn(require("ethers"), "zeroPadValue");
      await policy.apply(qb, { user: makeUser({ token: "tok" }) });
      expect(spy).toHaveBeenCalledWith(visibleUser, 32);
      spy.mockRestore();
    });
  });
});
