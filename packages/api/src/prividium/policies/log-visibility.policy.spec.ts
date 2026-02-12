import { Brackets, SelectQueryBuilder } from "typeorm";
import { mock } from "jest-mock-extended";

import { Log } from "../../log/log.entity";
import { RuleBasedLogVisibilityPolicy, NoopLogVisibilityPolicy } from "./log-visibility.policy";
import { PrividiumRulesService } from "../prividium-rules.service";

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
    const mockRules = [
      {
        contractAddress: "0xabc",
        topic0: "0xdead",
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

    it("skips when admin", async () => {
      await policy.apply(qb, { isAdmin: true });
      expect(qb.innerJoin).not.toHaveBeenCalled();
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(rulesService.fetchEventPermissionRules).not.toHaveBeenCalled();
    });

    it("applies visibleBy when userAddress present", async () => {
      await policy.apply(qb, { isAdmin: false, userAddress: visibleUser });
      expect(qb.innerJoin).toHaveBeenCalledWith("log.transaction", "transactions");
      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
    });

    it("fetches and applies permission rules when token present", async () => {
      await policy.apply(qb, { isAdmin: false, token: "token1", userAddress: visibleUser });
      expect(rulesService.fetchEventPermissionRules).toHaveBeenCalledWith("token1");
      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
    });

    it("short-circuits to FALSE when rules empty", async () => {
      rulesService.fetchEventPermissionRules.mockResolvedValue([]);
      await policy.apply(qb, { isAdmin: false, token: "token1", userAddress: visibleUser });
      expect(qb.andWhere).toHaveBeenCalledWith("FALSE");
    });
  });
});
