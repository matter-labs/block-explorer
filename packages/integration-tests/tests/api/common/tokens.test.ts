import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../../src/config";
import { localConfig } from "../../../src/config";
import { Buffer, Token } from "../../../src/entities";
import { Helper } from "../../../src/helper";

describe("Tokens", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  const bufferFile = "src/playbook/";
  let deployedToken: string;

  beforeAll(async () => {
    deployedToken = await helper.getStringFromFile(bufferFile + Buffer.L2);
  });

  describe("/tokens", () => {
    //@id1508
    it("Verify the response via /tokens", async () => {
      const l2DepositedToken = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
      const l1Token = await helper.getStringFromFile(bufferFile + Buffer.L1);
      const l2Token = deployedToken;

      const apiRoute = `/tokens`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body.items)).toStrictEqual(true))
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ l2Address: l2DepositedToken }))
        )
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ l1Address: l1Token })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ symbol: "L1" })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ name: "L1 ERC20 token" })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ decimals: 18 })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ l2Address: l2Token })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ l1Address: null })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ symbol: "L2" })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ name: "L2 ERC20 token" })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ decimals: 18 })))
        .expect((res) => expect(typeof res.body.meta.totalItems).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.itemCount).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.itemsPerPage).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.totalPages).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.currentPage).toStrictEqual("number"))
        .expect((res) => expect(res.body.links.first).toStrictEqual("tokens?limit=10"))
        .expect((res) => expect(res.body.links.previous).toStrictEqual(""))
        .expect((res) => expect(typeof res.body.links.next).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.links.last).toStrictEqual("string"));
    });
  });
  describe("/tokens/{tokenAddress}", () => {
    //@id1456
    it("Verify deployed to L2 custom token via /tokens/{tokenAddress}", async () => {
      await setTimeout(localConfig.extendedPause); //works unstable without timeout
      const apiRoute = `/tokens/${deployedToken}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            l2Address: deployedToken,
            l1Address: null,
            symbol: Token.customL2TokenSymbol,
            name: Token.customL2TokenName,
            decimals: Token.customL2TokenDecimals,
          })
        );
    });
  });
});
