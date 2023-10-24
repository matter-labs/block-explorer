import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../../src/config";
import { localConfig } from "../../../src/config";
import { Logger, Token } from "../../../src/entities";
import { Playbook } from "../../../src/playbook/playbook";

describe("Tokens", () => {
  jest.setTimeout(localConfig.standardTimeout);

  let deployedToken: string;

  describe("Deploy/check the custom ERC20 tokens", () => {
    const playbook = new Playbook();

    //@id603
    it("Deploy custom ERC20 token to L2", async () => {
      deployedToken = await playbook.deployERC20toL2();
      expect(deployedToken).toContain(Logger.txHashStartsWith);
    });

    //@id657
    it("Deploy custom ERC20 token to L1", async () => {
      deployedToken = await playbook.deployERC20toL1();
      expect(deployedToken).toContain(Logger.txHashStartsWith);
    });
  });
});
