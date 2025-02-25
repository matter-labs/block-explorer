import { mock } from "jest-mock-extended";
import { types } from "zksync-ethers";
import { BASE_TOKEN_ADDRESS, ETH_L1_ADDRESS } from "../constants";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { BlockchainService } from "../blockchain/blockchain.service";
import { TokenService } from "./token.service";
import { ContractAddress } from "../address/interface/contractAddress.interface";

describe("TokenService", () => {
  let tokenService: TokenService;
  let blockchainServiceMock: BlockchainService;
  let startGetTokenInfoDurationMetricMock: jest.Mock;
  let stopGetTokenInfoDurationMetricMock: jest.Mock;

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>({
      bridgeAddresses: {
        l2Erc20DefaultBridge: "0x0000000000000000000000000000000000001111",
      },
    });

    stopGetTokenInfoDurationMetricMock = jest.fn();
    startGetTokenInfoDurationMetricMock = jest.fn().mockReturnValue(stopGetTokenInfoDurationMetricMock);

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: "PROM_METRIC_GET_TOKEN_INFO_DURATION_SECONDS",
          useValue: {
            startTimer: startGetTokenInfoDurationMetricMock,
          },
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    tokenService = app.get<TokenService>(TokenService);
  });

  describe("getERC20Token", () => {
    let deployedContractAddress: ContractAddress;
    let transactionReceipt: types.TransactionReceipt;
    let tokenData;

    beforeEach(() => {
      tokenData = {
        symbol: "symbol",
        decimals: 18,
        name: "name",
      };

      transactionReceipt = mock<types.TransactionReceipt>({
        logs: [],
        to: "0x0000000000000000000000000000000000001111",
      });

      deployedContractAddress = mock<ContractAddress>({
        address: "0xdc187378edd8ed1585fb47549cc5fe633295d571",
        blockNumber: 10,
        transactionHash: "transactionHash",
        logIndex: 20,
      });

      jest.spyOn(blockchainServiceMock, "getERC20TokenData").mockResolvedValue(tokenData);
    });

    describe("when there is neither bridge initialization nor bridge initialize log for the current token address", () => {
      beforeEach(() => {
        transactionReceipt = mock<types.TransactionReceipt>({
          ...transactionReceipt,
          logs: [],
        });
      });

      it("starts the get token info duration metric", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(startGetTokenInfoDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      it("gets token data by the contract address", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledTimes(1);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledWith(deployedContractAddress.address);
      });

      it("returns the token without l1Address", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toStrictEqual({
          ...tokenData,
          blockNumber: deployedContractAddress.blockNumber,
          transactionHash: deployedContractAddress.transactionHash,
          l2Address: deployedContractAddress.address,
          logIndex: deployedContractAddress.logIndex,
        });
      });

      describe("when contract is ETH L2 contract", () => {
        it("returns ETH token with ETH l1Address", async () => {
          const ethTokenData = {
            symbol: "ETH",
            decimals: 18,
            name: "Ethers",
            l1Address: ETH_L1_ADDRESS,
          };
          const deployedETHContractAddress = mock<ContractAddress>({
            address: BASE_TOKEN_ADDRESS,
            blockNumber: 0,
            transactionHash: "transactionHash",
            logIndex: 0,
          });
          (blockchainServiceMock.getERC20TokenData as jest.Mock).mockResolvedValueOnce(ethTokenData);
          const token = await tokenService.getERC20Token(deployedETHContractAddress, transactionReceipt);
          expect(token).toStrictEqual({
            ...ethTokenData,
            blockNumber: deployedETHContractAddress.blockNumber,
            transactionHash: deployedETHContractAddress.transactionHash,
            l2Address: BASE_TOKEN_ADDRESS,
            l1Address: ETH_L1_ADDRESS,
            logIndex: deployedETHContractAddress.logIndex,
          });
        });
      });

      it("tracks the get token info duration metric", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(stopGetTokenInfoDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      describe("if ERC20 Contract function throws an exception", () => {
        beforeEach(() => {
          jest.spyOn(blockchainServiceMock, "getERC20TokenData").mockImplementation(() => {
            throw new Error("Ethers Contract error");
          });
        });

        it("returns null", async () => {
          const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
          expect(token).toBeNull();
        });

        it("does not track the get token info duration metric", async () => {
          await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
          expect(stopGetTokenInfoDurationMetricMock).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe("when transaction receipt does not contain logs", () => {
      beforeEach(() => {
        transactionReceipt = mock<types.TransactionReceipt>({
          ...transactionReceipt,
          logs: null,
        });
      });

      it("starts the get token info duration metric", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(startGetTokenInfoDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      it("gets token data by the contract address", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledTimes(1);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledWith(deployedContractAddress.address);
      });

      it("returns the token without l1Address", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toStrictEqual({
          ...tokenData,
          blockNumber: deployedContractAddress.blockNumber,
          transactionHash: deployedContractAddress.transactionHash,
          l2Address: deployedContractAddress.address,
          logIndex: deployedContractAddress.logIndex,
        });
      });

      it("tracks the get token info duration metric", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(stopGetTokenInfoDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      describe("if ERC20 Contract function throws an exception", () => {
        beforeEach(() => {
          jest.spyOn(blockchainServiceMock, "getERC20TokenData").mockImplementation(() => {
            throw new Error("Ethers Contract error");
          });
        });

        it("returns null", async () => {
          const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
          expect(token).toBeNull();
        });

        it("does not track the get token info duration metric", async () => {
          await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
          expect(stopGetTokenInfoDurationMetricMock).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe("when there is a bridge initialization log in transaction receipt for the current token address", () => {
      let bridgedToken;

      beforeEach(() => {
        transactionReceipt = mock<types.TransactionReceipt>({
          ...transactionReceipt,
          logs: [
            mock<types.Log>({
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x000000000000000000000000c7e0220d02d549c4846a6ec31d89c3b670ebe35c",
                "0x0100014340e955cbf39159da998b3374bee8f3c0b3c75a7a9e3df6b85052379d",
                "0x000000000000000000000000dc187378edd8ed1585fb47549cc5fe633295d571",
              ],
            }),
            mock<types.Log>({
              address: "0xdc187378edD8Ed1585fb47549Cc5fe633295d571",
              topics: [
                "0xe6b2ac4004ee4493db8844da5db69722d2128345671818c3c41928655a83fb2c",
                "0x0000000000000000000000000db321efaa9e380d0b37b55b530cdaa62728b9a3",
              ],
              data: "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000441444c3100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000441444c3100000000000000000000000000000000000000000000000000000000",
            }),
          ],
        });

        bridgedToken = {
          name: "ADL1",
          symbol: "ADL1",
          decimals: BigInt(18),
        };
      });

      it("extract token info from log and does not call web3 API to get token data", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledTimes(0);
      });

      it("returns the token with l1Address", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toStrictEqual({
          ...bridgedToken,
          blockNumber: deployedContractAddress.blockNumber,
          transactionHash: deployedContractAddress.transactionHash,
          l2Address: deployedContractAddress.address,
          l1Address: "0x0Db321EFaa9E380d0B37B55B530CDaA62728B9a3",
          logIndex: deployedContractAddress.logIndex,
        });
      });
    });

    describe("when there is a bridge initialization log in transaction receipt which is not produced by the bridge contract", () => {
      beforeEach(() => {
        transactionReceipt = mock<types.TransactionReceipt>({
          ...transactionReceipt,
          to: "0x0000000000000000000000000000000000001112",
          logs: [
            mock<types.Log>({
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x000000000000000000000000c7e0220d02d549c4846a6ec31d89c3b670ebe35c",
                "0x0100014340e955cbf39159da998b3374bee8f3c0b3c75a7a9e3df6b85052379d",
                "0x000000000000000000000000dc187378edd8ed1585fb47549cc5fe633295d571",
              ],
            }),
            mock<types.Log>({
              address: "0xdc187378edD8Ed1585fb47549Cc5fe633295d571",
              topics: [
                "0xe6b2ac4004ee4493db8844da5db69722d2128345671818c3c41928655a83fb2c",
                "0x0000000000000000000000000db321efaa9e380d0b37b55b530cdaa62728b9a3",
              ],
              data: "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000441444c3100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000441444c3100000000000000000000000000000000000000000000000000000000",
            }),
          ],
        });
      });

      it("starts the get token info duration metric", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(startGetTokenInfoDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      it("gets token data by the contract address", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledTimes(1);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledWith(deployedContractAddress.address);
      });

      it("returns the token without l1Address", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toStrictEqual({
          ...tokenData,
          blockNumber: deployedContractAddress.blockNumber,
          transactionHash: deployedContractAddress.transactionHash,
          l2Address: deployedContractAddress.address,
          logIndex: deployedContractAddress.logIndex,
        });
      });
    });

    describe("when there is a bridge initialize log in transaction receipt for the current token address", () => {
      let bridgedToken;

      beforeEach(() => {
        transactionReceipt = mock<types.TransactionReceipt>({
          ...transactionReceipt,
          logs: [
            mock<types.Log>({
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x000000000000000000000000913389f49358cb49a8e9e984a5871df43f80eb96",
                "0x01000125c745537b5254be2ca086aee7fbd5d91789ed15790a942f9422d36447",
                "0x0000000000000000000000005a393c95e7bddd0281650023d8c746fb1f596b7b",
              ],
            }),
            mock<types.Log>({
              address: "0x5a393c95e7Bddd0281650023D8C746fB1F596B7b",
              topics: [
                "0x81e8e92e5873539605a102eddae7ed06d19bea042099a437cbc3644415eb7404",
                "0x000000000000000000000000c8f8ce6491227a6a2ab92e67a64011a4eba1c6cf",
              ],
              data: "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000134c313131206465706c6f79656420746f204c310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044c31313100000000000000000000000000000000000000000000000000000000",
            }),
          ],
        });

        deployedContractAddress = mock<ContractAddress>({
          address: "0x5a393c95e7bddd0281650023d8c746fb1f596b7b",
          blockNumber: 10,
          transactionHash: "transactionHash",
          logIndex: 20,
        });

        bridgedToken = {
          name: "L111 deployed to L1",
          symbol: "L111",
          decimals: BigInt(18),
        };
      });

      it("extract token info from log and does not call web3 API to get token data", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledTimes(0);
      });

      it("returns the token with l1Address", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toStrictEqual({
          ...bridgedToken,
          blockNumber: deployedContractAddress.blockNumber,
          transactionHash: deployedContractAddress.transactionHash,
          l2Address: deployedContractAddress.address,
          l1Address: "0xc8F8cE6491227a6a2Ab92e67a64011a4Eba1C6CF",
          logIndex: deployedContractAddress.logIndex,
        });
      });
    });

    describe("when there is a bridge initialize log in transaction receipt which is not produced by the bridge contract", () => {
      beforeEach(() => {
        transactionReceipt = mock<types.TransactionReceipt>({
          ...transactionReceipt,
          to: "0x0000000000000000000000000000000000001112",
          logs: [
            mock<types.Log>({
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x000000000000000000000000913389f49358cb49a8e9e984a5871df43f80eb96",
                "0x01000125c745537b5254be2ca086aee7fbd5d91789ed15790a942f9422d36447",
                "0x0000000000000000000000005a393c95e7bddd0281650023d8c746fb1f596b7b",
              ],
            }),
            mock<types.Log>({
              address: "0x5a393c95e7Bddd0281650023D8C746fB1F596B7b",
              topics: [
                "0x81e8e92e5873539605a102eddae7ed06d19bea042099a437cbc3644415eb7404",
                "0x000000000000000000000000c8f8ce6491227a6a2ab92e67a64011a4eba1c6cf",
              ],
              data: "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000134c313131206465706c6f79656420746f204c310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044c31313100000000000000000000000000000000000000000000000000000000",
            }),
          ],
        });

        deployedContractAddress = mock<ContractAddress>({
          address: "0x5a393c95e7bddd0281650023d8c746fb1f596b7b",
          blockNumber: 10,
          transactionHash: "transactionHash",
          logIndex: 20,
        });
      });

      it("starts the get token info duration metric", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(startGetTokenInfoDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      it("gets token data by the contract address", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledTimes(1);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledWith(deployedContractAddress.address);
      });

      it("returns the token without l1Address", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toStrictEqual({
          ...tokenData,
          blockNumber: deployedContractAddress.blockNumber,
          transactionHash: deployedContractAddress.transactionHash,
          l2Address: deployedContractAddress.address,
          logIndex: deployedContractAddress.logIndex,
        });
      });
    });

    describe("when there is a bridge initialize log in transaction receipt but the default bridge contract is not defined", () => {
      beforeEach(() => {
        blockchainServiceMock.bridgeAddresses.l2Erc20DefaultBridge = undefined;
        transactionReceipt = mock<types.TransactionReceipt>({
          ...transactionReceipt,
          to: "0x0000000000000000000000000000000000001112",
          logs: [
            mock<types.Log>({
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x000000000000000000000000913389f49358cb49a8e9e984a5871df43f80eb96",
                "0x01000125c745537b5254be2ca086aee7fbd5d91789ed15790a942f9422d36447",
                "0x0000000000000000000000005a393c95e7bddd0281650023d8c746fb1f596b7b",
              ],
            }),
            mock<types.Log>({
              address: "0x5a393c95e7Bddd0281650023D8C746fB1F596B7b",
              topics: [
                "0x81e8e92e5873539605a102eddae7ed06d19bea042099a437cbc3644415eb7404",
                "0x000000000000000000000000c8f8ce6491227a6a2ab92e67a64011a4eba1c6cf",
              ],
              data: "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000134c313131206465706c6f79656420746f204c310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044c31313100000000000000000000000000000000000000000000000000000000",
            }),
          ],
        });

        deployedContractAddress = mock<ContractAddress>({
          address: "0x5a393c95e7bddd0281650023d8c746fb1f596b7b",
          blockNumber: 10,
          transactionHash: "transactionHash",
          logIndex: 20,
        });
      });

      it("starts the get token info duration metric", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(startGetTokenInfoDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      it("gets token data by the contract address", async () => {
        await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledTimes(1);
        expect(blockchainServiceMock.getERC20TokenData).toHaveBeenCalledWith(deployedContractAddress.address);
      });

      it("returns the token without l1Address", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toStrictEqual({
          ...tokenData,
          blockNumber: deployedContractAddress.blockNumber,
          transactionHash: deployedContractAddress.transactionHash,
          l2Address: deployedContractAddress.address,
          logIndex: deployedContractAddress.logIndex,
        });
      });
    });

    describe("if the token symbol or name has special symbols", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getERC20TokenData").mockResolvedValueOnce({
          ...tokenData,
          symbol: "\0\0\0\0\0\0test symbol",
          name: "\0\0\0\0\0\0test name",
        });
      });

      it("returns token with special chars replaced", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toEqual({
          blockNumber: 10,
          decimals: 18,
          l2Address: "0xdc187378edd8ed1585fb47549cc5fe633295d571",
          logIndex: 20,
          name: "test name",
          symbol: "test symbol",
          transactionHash: "transactionHash",
        });
      });
    });

    describe("if the token symbol is empty", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getERC20TokenData").mockResolvedValueOnce({
          ...tokenData,
          symbol: "",
        });
      });

      it("returns null", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toBeNull();
      });
    });

    describe("if the token symbol has special symbols only", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getERC20TokenData").mockResolvedValueOnce({
          ...tokenData,
          symbol: "\0\0\0\0\0\0",
        });
      });

      it("returns null", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress, transactionReceipt);
        expect(token).toBeNull();
      });
    });

    describe("when transactionReceipt param is not provided", () => {
      it("returns the token without l1Address when token is valid", async () => {
        const token = await tokenService.getERC20Token(deployedContractAddress);
        expect(token).toStrictEqual({
          ...tokenData,
          blockNumber: deployedContractAddress.blockNumber,
          transactionHash: deployedContractAddress.transactionHash,
          l2Address: deployedContractAddress.address,
          logIndex: deployedContractAddress.logIndex,
        });
      });
    });
  });
});
