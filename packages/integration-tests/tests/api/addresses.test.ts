import { localConfig } from "../../src/config";
import { Buffer, Token, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("Address", () => {
  jest.setTimeout(localConfig.extendedTimeout);

  const helper = new Helper();
  const playbook = new Playbook();
  const bufferFile = "src/playbook/";
  let apiRoute: string;
  let contract: string;
  let token: string;
  let txHash: string;
  let response;

  describe("/address/{address}", () => {
    beforeAll(async () => {
      await playbook.deployNFTtoL2();
      await playbook.deployMultiCallContracts();
      await playbook.deployMultiTransferETH();
      await playbook.deployGreeterToL2();
      await playbook.useMultiCallContracts();
      await playbook.useMultiTransferETH();
    });

    //@id1457
    it("Verify deployed to L2 NFT via /address/{address}", async () => {
      await helper.retryTestAction(async () => {
        token = await helper.getStringFromFile(bufferFile + Buffer.NFTtoL2);
        apiRoute = `/address/${token}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(
          expect.objectContaining({
            type: "contract",
            address: token,
            balances: {
              [`${token}`]: {
                balance: "1",
                token: null,
              },
            },
          })
        );
      });
    });

    //@id1464
    it("Verify the deployed Root contract via /address/{address}", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiCallRoot);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallRoot);
        apiRoute = `/address/${contract}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({ type: "contract" }));
        expect(response.body).toEqual(expect.objectContaining({ address: contract }));
        expect(response.body).toEqual(expect.objectContaining({ creatorAddress: Wallets.richWalletAddress }));
        expect(response.body).toEqual(expect.objectContaining({ creatorTxHash: txHash }));
        expect(response.body).toEqual(expect.objectContaining({ balances: {} }));
      });
    });

    //@id1465
    it("Verify the deployed Middle contract via /address/{address}", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiCallMiddle);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallMiddle);
        apiRoute = `/address/${contract}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({ type: "contract" }));
        expect(response.body).toEqual(expect.objectContaining({ address: contract }));
        expect(response.body).toEqual(expect.objectContaining({ creatorAddress: Wallets.richWalletAddress }));
        expect(response.body).toEqual(expect.objectContaining({ creatorTxHash: txHash }));
        expect(response.body).toEqual(expect.objectContaining({ balances: {} }));
      });
    });

    //@id1466
    it("Verify the deployed Caller contract via /address/{address}", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiCallCaller);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallCaller);
        apiRoute = `/address/${contract}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({ type: "contract" }));
        expect(response.body).toEqual(expect.objectContaining({ address: contract }));
        expect(response.body).toEqual(expect.objectContaining({ creatorAddress: Wallets.richWalletAddress }));
        expect(response.body).toEqual(expect.objectContaining({ creatorTxHash: txHash }));
        expect(response.body).toEqual(expect.objectContaining({ balances: {} }));
      });
    });

    //@id1476
    it("Verify the deployed multitransfer contract via /address/{address}", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiTransferETH);
        apiRoute = `/address/${contract}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({ address: contract }));
        expect(response.body).toEqual(expect.objectContaining({ creatorAddress: Wallets.richWalletAddress }));
      });
    });

    //@id1449
    it("Verify the deployed Greeter contract via /address/{address}", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.greeterL2);
        apiRoute = `/address/${contract}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({ address: contract }));
        expect(response.body).toEqual(expect.objectContaining({ balances: {} }));
      });
    });
  });

  describe("/address/{address}/logs", () => {
    beforeAll(async () => {
      await playbook.useGreeter();
    });

    //@id1510
    it("Verify the transaction via /address/{address}/logs", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.greeterL2);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.executeGreeterTx);
        apiRoute = `/address/${contract}/logs`;
        const decapitalizedAddress = apiRoute.slice(1).toLowerCase();
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toEqual(expect.objectContaining({ address: contract }));
        expect(Array.isArray(response.body.items[0].topics)).toStrictEqual(true);
        expect(typeof response.body.items[0].data).toStrictEqual("string");
        expect(response.body.items[0]).toEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(typeof response.body.items[0].transactionIndex).toStrictEqual("number");
        expect(typeof response.body.items[0].logIndex).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(response.body.meta).toEqual(expect.objectContaining({ totalItems: 1 }));
        expect(response.body.meta).toEqual(expect.objectContaining({ itemCount: 1 }));
        expect(response.body.meta).toEqual(expect.objectContaining({ itemsPerPage: 10 }));
        expect(response.body.meta).toEqual(expect.objectContaining({ totalPages: 1 }));
        expect(response.body.meta).toEqual(expect.objectContaining({ currentPage: 1 }));
        expect(response.body.links).toEqual(expect.objectContaining({ first: `${decapitalizedAddress}?limit=10` }));
        expect(response.body.links).toEqual(expect.objectContaining({ previous: "" }));
        expect(response.body.links).toEqual(expect.objectContaining({ next: "" }));
        expect(response.body.links).toEqual(
          expect.objectContaining({ last: `${decapitalizedAddress}?page=1&limit=10` })
        );
      });
    });
  });

  describe("/address/{address}/transfers", () => {
    beforeAll(async () => {
      await playbook.deployViaPaymaster();
      await playbook.usePaymaster();
    });

    //@id1509
    it("Verify the transaction via /address/{address}/transfers", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.paymaster);
        const emptyWallet = await helper.getStringFromFile(bufferFile + Buffer.emptyWalletAddress);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.paymasterTx);
        const customTokenAddress = await helper.getStringFromFile(bufferFile + Buffer.customToken);
        apiRoute = `/address/${contract}/transfers`;
        const decapitalizedAddress = apiRoute.slice(1).toLowerCase();
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: emptyWallet }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0].timestamp).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ amount: "1" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: customTokenAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: "transfer" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ l2Address: customTokenAddress }));
        expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ l1Address: null }));
        expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ symbol: "MyToken" }));
        expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ name: "MyToken" }));
        expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ decimals: 18 }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(typeof response.body.items[1].timestamp).toStrictEqual("string");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "30000000000000000" }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalItems: 2 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemCount: 2 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemsPerPage: 10 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalPages: 1 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ currentPage: 1 }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ first: `${decapitalizedAddress}?limit=10` })
        );
        expect(response.body.links).toStrictEqual(expect.objectContaining({ previous: "" }));
        expect(response.body.links).toStrictEqual(expect.objectContaining({ next: "" }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ last: `${decapitalizedAddress}?page=1&limit=10` })
        );
      });
    });
  });
});
