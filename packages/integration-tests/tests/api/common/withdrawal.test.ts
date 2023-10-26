import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment, localConfig } from "../../../src/config";
import { Buffer, Token, Wallets } from "../../../src/entities";
import { Logger } from "../../../src/entities";
import { Helper } from "../../../src/helper";
import { Playbook } from "../../../src/playbook/playbook";

describe("Withdrawal", () => {
  const playbook = new Playbook();
  const helper = new Helper();
  const playbookRoot = "src/playbook";
  const l2Token = playbookRoot + "/" + Buffer.L2deposited;
  const l1Token = playbookRoot + "/" + Buffer.L1;

  let result: string;
  jest.setTimeout(localConfig.extendedTimeout);

  describe("Withdrawal ETH to the own address", () => {
    //@id639
    it("Make a withdrawal to the own address with 0.0000001 ETH ", async () => {
      result = await playbook.withdrawETH();
      await expect(result).not.toBeUndefined();
      await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
    });
  });

  describe("Withdrawal ETH to the other address", () => {
    //@id640
    it("Make a withdrawal to the other address with 0.0000001 ETH ", async () => {
      result = await playbook.withdrawETHtoOtherAddress();
      await expect(result).not.toBeUndefined();
      await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
    });
  });

  describe("Withdrawal the custom token to the own address", () => {
    //@id641
    it("Make the custom token withdrawal to the own address", async () => {
      const customToken = await helper.getStringFromFile(l2Token);
      result = await playbook.withdrawERC20(customToken);
      await expect(result).not.toBeUndefined();
      await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
    });
  });

  describe("Withdrawal the custom token to the other address", () => {
    //@id643
    it("Make the custom token withdrawal to the other address", async () => {
      const customToken = await helper.getStringFromFile(l2Token);
      result = await playbook.withdrawERC20toOtherAddress(customToken);
      await expect(result).not.toBeUndefined();
      await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
    });
  });
});
