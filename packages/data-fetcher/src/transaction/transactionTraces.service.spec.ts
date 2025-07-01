import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { types } from "zksync-ethers";
import { TransactionTracesService, ContractAddress } from "./transactionTraces.service";
import { BlockchainService, TransactionTrace } from "../blockchain";
import { TokenService, Token } from "../token/token.service";
import * as contractDeployedTraces from "../../test/traces/multiple-create.json";

describe("TransactionTracesService", () => {
  let transactionTracesService: TransactionTracesService;
  let blockchainServiceMock: BlockchainService;
  let tokenServiceMock: TokenService;

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>();
    tokenServiceMock = mock<TokenService>();

    const app = await Test.createTestingModule({
      providers: [
        TransactionTracesService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: TokenService,
          useValue: tokenServiceMock,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    transactionTracesService = app.get<TransactionTracesService>(TransactionTracesService);
  });

  describe("getData", () => {
    const tokens: Token[] = [
      {
        l1Address: "l1Address1",
      } as Token,
      {
        l1Address: "l1Address2",
      } as Token,
      {
        l1Address: "l1Address3",
      } as Token,
    ];

    let transactionReceipt: types.TransactionReceipt;

    beforeEach(() => {
      jest
        .spyOn(blockchainServiceMock, "debugTraceTransaction")
        .mockResolvedValueOnce(contractDeployedTraces as TransactionTrace);
      jest.spyOn(blockchainServiceMock, "getCode").mockImplementation(async (address: string) => {
        return `${address}-bytecode`;
      });
      jest.spyOn(blockchainServiceMock, "getRawCodeHash").mockImplementation(async (address: string) => {
        return `${address}-codeHash`;
      });
      jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValueOnce(tokens[0]);
      jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValueOnce(tokens[1]);
      jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValueOnce(tokens[2]);

      transactionReceipt = mock<types.TransactionReceipt>({
        hash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
        blockNumber: 123456,
        from: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
      });
    });

    it("requests transaction trace data", () => {
      transactionTracesService.getData(transactionReceipt);
      expect(blockchainServiceMock.debugTraceTransaction).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.debugTraceTransaction).toHaveBeenCalledWith(transactionReceipt.hash, false);
    });

    it("returns contract addresses", async () => {
      const data = await transactionTracesService.getData(transactionReceipt);
      expect(data.contractAddresses).toEqual([
        {
          address: "0x681a1afdc2e06776816386500d2d461a6c96cb45",
          blockNumber: 123456,
          bytecode: "0x681a1afdc2e06776816386500d2d461a6c96cb45-bytecode",
          creatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
          isEvmLike: false,
          logIndex: 1,
          transactionHash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
        },
        {
          address: "0xa0c9cf35e98810794d0ac664408e778a4f6e69bd",
          blockNumber: 123456,
          bytecode: "0xa0c9cf35e98810794d0ac664408e778a4f6e69bd-bytecode",
          creatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
          isEvmLike: false,
          logIndex: 2,
          transactionHash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
        },
        {
          address: "0x89057dea64da472a8422287c6cf0b2ebb3b3d8df",
          blockNumber: 123456,
          bytecode: "0x89057dea64da472a8422287c6cf0b2ebb3b3d8df-bytecode",
          creatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
          isEvmLike: false,
          logIndex: 3,
          transactionHash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
        },
      ]);
    });

    it("returns erc20 tokens", async () => {
      const data = await transactionTracesService.getData(transactionReceipt);
      expect(data.tokens).toEqual([
        { l1Address: "l1Address1" },
        { l1Address: "l1Address2" },
        { l1Address: "l1Address3" },
      ]);
    });

    describe("when transaction trace is null", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "debugTraceTransaction").mockReset().mockResolvedValue(null);
      });

      it("returns null", async () => {
        const data = await transactionTracesService.getData(transactionReceipt);
        expect(data).toEqual({ contractAddresses: [], error: undefined, revertReason: undefined, tokens: [] });
      });
    });

    describe("when contract's bytecode is EVM-like", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getRawCodeHash").mockImplementation(async (address: string) => {
          if (address === "0x681a1afdc2e06776816386500d2d461a6c96cb45") {
            return "0x02123"; // EVM-like code hash
          } else if (address === "0xa0c9cf35e98810794d0ac664408e778a4f6e69bd") {
            return "0x01abc"; // EraVM-like code hash
          } else if (address === "0x89057dea64da472a8422287c6cf0b2ebb3b3d8df") {
            return "0x02123"; // EVM-like code hash
          }
        });
      });

      it("marks contract as EVM-like", async () => {
        const data = await transactionTracesService.getData(transactionReceipt);
        expect(data.contractAddresses[0].isEvmLike).toBe(true);
        expect(data.contractAddresses[1].isEvmLike).toBe(false);
        expect(data.contractAddresses[2].isEvmLike).toBe(true);
      });
    });

    describe("when contract's bytecode is empty", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getCode").mockImplementation(async (address: string) => {
          if (address === "0x681a1afdc2e06776816386500d2d461a6c96cb45") {
            return "0x"; // Empty bytecode
          }
          return `${address}-bytecode`;
        });
      });

      it("filters out the contract with empty bytecode", async () => {
        const data = await transactionTracesService.getData(transactionReceipt);
        expect(data.contractAddresses.length).toBe(2);
        expect(
          data.contractAddresses.some((addr) => addr.address === "0x681a1afdc2e06776816386500d2d461a6c96cb45")
        ).toBe(false);
      });
    });

    describe("when contract address is not an ERC20 token", () => {
      beforeEach(() => {
        (tokenServiceMock.getERC20Token as jest.Mock).mockReset();
      });

      it("returns only available ERC20 tokens", async () => {
        jest.spyOn(tokenServiceMock, "getERC20Token").mockImplementation(async (contractAddress: ContractAddress) => {
          if (contractAddress.address === "0xa0c9cf35e98810794d0ac664408e778a4f6e69bd") {
            return tokens[1];
          } else if (contractAddress.address === "0x89057dea64da472a8422287c6cf0b2ebb3b3d8df") {
            return tokens[2];
          }
          return null;
        });
        const data = await transactionTracesService.getData(transactionReceipt);
        expect(data.tokens).toEqual([tokens[1], tokens[2]]);
      });

      it("returns empty array if there are no ERC20 tokens", async () => {
        jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValue(null);
        const data = await transactionTracesService.getData(transactionReceipt);
        expect(data.tokens).toEqual([]);
      });
    });
  });
});
