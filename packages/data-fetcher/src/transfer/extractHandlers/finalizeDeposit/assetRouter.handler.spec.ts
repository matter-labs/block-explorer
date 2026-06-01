import { Log } from "ethers";
import { mock } from "jest-mock-extended";
import { L2_ASSET_ROUTER_ADDRESS } from "../../../constants";
import { assetRouterFinalizeDepositHandler } from "./assetRouter.handler";

describe("assetRouterFinalizeDepositHandler", () => {
  describe("matches", () => {
    it("returns true when the log is emitted by the trusted L2 Asset Router", () => {
      const log = mock<Log>({ address: L2_ASSET_ROUTER_ADDRESS });
      expect(assetRouterFinalizeDepositHandler.matches(log, null)).toBe(true);
    });

    it("returns false when the log is emitted by any other (attacker) contract", () => {
      const log = mock<Log>({ address: "0x1234567890aBcDeF1234567890AbCdEf12345678" });
      expect(assetRouterFinalizeDepositHandler.matches(log, null)).toBe(false);
    });
  });
});
