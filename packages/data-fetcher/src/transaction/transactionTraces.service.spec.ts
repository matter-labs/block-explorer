import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { Block, TransactionReceipt, TransactionResponse } from "ethers";
import { TransactionTracesService, ContractAddress } from "./transactionTraces.service";
import { BlockchainService } from "../blockchain";
import { TokenService, Token } from "../token/token.service";
import * as contractDeployedTraces from "../../test/traces/multiple-create.json";
import * as revertedTxTraces from "../../test/traces/reverted-tx.json";
import * as multipleBaseTokenTransfersTraces from "../../test/traces/multiple-base-token-transfers.json";
import * as systemContractsUpgradeTxReceipt from "../../test/transactionReceipts/system-contracts-upgrade.json";
import * as systemContractsUpgradeTxResponse from "../../test/transactionResponses/system-contracts-upgrade.json";

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

    let block: Block;
    let transactionResponse: TransactionResponse;
    let transactionReceipt: TransactionReceipt;

    beforeEach(() => {
      jest.spyOn(blockchainServiceMock, "getCode").mockImplementation(async (address: string) => {
        return `${address}-bytecode`;
      });
      jest.spyOn(blockchainServiceMock, "getRawCodeHash").mockImplementation(async (address: string) => {
        return `${address}-codeHash`;
      });
      jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValueOnce(tokens[0]);
      jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValueOnce(tokens[1]);
      jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValueOnce(tokens[2]);

      block = mock<Block>({
        number: 123456,
        timestamp: Math.floor(Date.now() / 1000),
      });
      transactionResponse = mock<TransactionResponse>({
        hash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
        blockNumber: 123456,
        from: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
        index: 1,
      });
      transactionReceipt = mock<TransactionReceipt>({
        hash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
        blockNumber: 123456,
        from: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
      });
    });

    it("returns contract addresses", async () => {
      const data = await transactionTracesService.getData(
        block,
        transactionResponse,
        transactionReceipt,
        contractDeployedTraces
      );
      expect(data.contractAddresses).toEqual([
        {
          address: "0x681a1afdc2e06776816386500d2d461a6c96cb45",
          blockNumber: 123456,
          bytecode: "0x681a1afdc2e06776816386500d2d461a6c96cb45-bytecode",
          creatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
          isEvmLike: true,
          logIndex: 1,
          transactionHash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
        },
        {
          address: "0xa0c9cf35e98810794d0ac664408e778a4f6e69bd",
          blockNumber: 123456,
          bytecode: "0xa0c9cf35e98810794d0ac664408e778a4f6e69bd-bytecode",
          creatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
          isEvmLike: true,
          logIndex: 2,
          transactionHash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
        },
        {
          address: "0x89057dea64da472a8422287c6cf0b2ebb3b3d8df",
          blockNumber: 123456,
          bytecode: "0x89057dea64da472a8422287c6cf0b2ebb3b3d8df-bytecode",
          creatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
          isEvmLike: true,
          logIndex: 3,
          transactionHash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
        },
      ]);
    });

    it("returns erc20 tokens", async () => {
      const data = await transactionTracesService.getData(
        block,
        transactionResponse,
        transactionReceipt,
        contractDeployedTraces
      );
      expect(data.tokens).toEqual([
        { l1Address: "l1Address1" },
        { l1Address: "l1Address2" },
        { l1Address: "l1Address3" },
      ]);
    });

    describe("when transaction is reverted", () => {
      it("returns transaction error and error reason", async () => {
        const data = await transactionTracesService.getData(
          block,
          transactionResponse,
          transactionReceipt,
          revertedTxTraces
        );
        expect(data.error).toEqual("Bootloader-based tx failed");
        expect(data.revertReason).toEqual("A1");
      });
    });

    describe("when transaction transfers base token", () => {
      it("returns base token transfers", async () => {
        const data = await transactionTracesService.getData(
          block,
          transactionResponse,
          transactionReceipt,
          multipleBaseTokenTransfersTraces
        );
        expect(data.transfers).toEqual([
          {
            amount: BigInt(1122029021306663),
            blockNumber: block.number,
            from: "0x0000000000000000000000000000000000000000",
            isFeeOrRefund: false,
            logIndex: 1,
            timestamp: new Date(block.timestamp * 1000),
            to: "0x0000000000000000000000000000000000008001",
            tokenAddress: "0x000000000000000000000000000000000000800a",
            tokenType: "BASETOKEN",
            transactionHash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
            transactionIndex: 1,
            type: "transfer",
          },
          {
            amount: BigInt(9936370575000),
            blockNumber: block.number,
            from: "0x0401340cd4cbd08a651e65c66eaa871086ffb9d5",
            isFeeOrRefund: false,
            logIndex: 2,
            timestamp: new Date(block.timestamp * 1000),
            to: "0x0000000000000000000000000000000000008001",
            tokenAddress: "0x000000000000000000000000000000000000800a",
            tokenType: "BASETOKEN",
            transactionHash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
            transactionIndex: 1,
            type: "transfer",
          },
          {
            amount: BigInt(1122029021306663),
            blockNumber: block.number,
            from: "0x0401340cd4cbd08a651e65c66eaa871086ffb9d5",
            isFeeOrRefund: false,
            logIndex: 3,
            timestamp: new Date(block.timestamp * 1000),
            to: "0xb21a4f545d4d80efb929b7f49a266516c4dddbfc",
            tokenAddress: "0x000000000000000000000000000000000000800a",
            tokenType: "BASETOKEN",
            transactionHash: "0x75cae7288587ca63fc468e16a909e570dec5eb1e58a2c6017ff97e97c2134859",
            transactionIndex: 1,
            type: "transfer",
          },
        ]);
      });
    });

    describe("when transaction is a system contracts upgrade tx", () => {
      it("returns system contracts addresses", async () => {
        const data = await transactionTracesService.getData(
          block,
          {
            ...systemContractsUpgradeTxResponse,
            data: (systemContractsUpgradeTxResponse as any).input,
          } as unknown as TransactionResponse,
          {
            ...systemContractsUpgradeTxReceipt,
            hash: (systemContractsUpgradeTxReceipt as any).transactionHash,
          } as unknown as TransactionReceipt,
          null
        );
        expect(data.contractAddresses).toEqual([
          {
            address: "0x0000000000000000000000000000000000000000",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000000000-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 1,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000000001",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000000001-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 2,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000000002",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000000002-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 3,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000000004",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000000004-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 4,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000000006",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000000006-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 5,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000000007",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000000007-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 6,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000000008",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000000008-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 7,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000000005",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000000005-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 8,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008001",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008001-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 9,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008002",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008002-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 10,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008003",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008003-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 11,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008004",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008004-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 12,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008005",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008005-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 13,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008006",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008006-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 14,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008008",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008008-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 15,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008009",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008009-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 16,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x000000000000000000000000000000000000800A",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x000000000000000000000000000000000000800A-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 17,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x000000000000000000000000000000000000800B",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x000000000000000000000000000000000000800B-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 18,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x000000000000000000000000000000000000800c",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x000000000000000000000000000000000000800c-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 19,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x000000000000000000000000000000000000800d",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x000000000000000000000000000000000000800d-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 20,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x000000000000000000000000000000000000800E",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x000000000000000000000000000000000000800E-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 21,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x000000000000000000000000000000000000800f",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x000000000000000000000000000000000000800f-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 22,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008010",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008010-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 23,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008012",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008012-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 24,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008013",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008013-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 25,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008014",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008014-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 26,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008015",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008015-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 27,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000000100",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000000100-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 28,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000008011",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000008011-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 29,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000010000",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000010000-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 30,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000010001",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000010001-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 31,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000010006",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000010006-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 32,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000010002",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000010002-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 33,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000010003",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000010003-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 34,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000010004",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000010004-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 35,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000010005",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000010005-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 36,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
          {
            address: "0x0000000000000000000000000000000000010007",
            blockNumber: "0x3b2f5f0",
            bytecode: "0x0000000000000000000000000000000000010007-bytecode",
            creatorAddress: "0x0000000000000000000000000000000000008007",
            isEvmLike: true,
            logIndex: 37,
            transactionHash: "0x6e60bd0408b14d086d55f00ff7313e9826e748a6fddf5cda55ae2883321c9804",
          },
        ]);
      });
    });

    describe("when transaction trace is null", () => {
      it("returns null", async () => {
        const data = await transactionTracesService.getData(block, transactionResponse, transactionReceipt, null);
        expect(data).toEqual({
          contractAddresses: [],
          error: undefined,
          revertReason: undefined,
          tokens: [],
          transfers: [],
        });
      });
    });

    it("marks contract as EVM-like", async () => {
      const data = await transactionTracesService.getData(
        block,
        transactionResponse,
        transactionReceipt,
        contractDeployedTraces
      );
      expect(data.contractAddresses[0].isEvmLike).toBe(true);
      expect(data.contractAddresses[1].isEvmLike).toBe(true);
      expect(data.contractAddresses[2].isEvmLike).toBe(true);
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
        const data = await transactionTracesService.getData(
          block,
          transactionResponse,
          transactionReceipt,
          contractDeployedTraces
        );
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
        const data = await transactionTracesService.getData(
          block,
          transactionResponse,
          transactionReceipt,
          contractDeployedTraces
        );
        expect(data.tokens).toEqual([tokens[1], tokens[2]]);
      });

      it("returns empty array if there are no ERC20 tokens", async () => {
        jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValue(null);
        const data = await transactionTracesService.getData(
          block,
          transactionResponse,
          transactionReceipt,
          contractDeployedTraces
        );
        expect(data.tokens).toEqual([]);
      });
    });
  });
});
