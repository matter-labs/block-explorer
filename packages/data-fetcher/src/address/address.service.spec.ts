import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { types } from "zksync-ethers";
import { AddressService } from "./address.service";
import { BlockchainService } from "../blockchain/blockchain.service";

describe("AddressService", () => {
  let blockchainServiceMock: BlockchainService;
  let addressService: AddressService;

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>();

    const app = await Test.createTestingModule({
      providers: [
        AddressService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    addressService = app.get<AddressService>(AddressService);
  });

  describe("getContractAddresses", () => {
    const logs = [
      mock<types.Log>({
        topics: [
          "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
          "0x000000000000000000000000c7e0220d02d549c4846a6ec31d89c3b670ebe35c",
          "0x0100014340e955cbf39159da998b3374bee8f3c0b3c75a7a9e3df6b85052379d",
          "0x000000000000000000000000dc187378edd8ed1585fb47549cc5fe633295d571",
        ],
        index: 1,
      }),
      mock<types.Log>({
        topics: [
          "0xe6b2ac4004ee4493db8844da5db69722d2128345671818c3c41928655a83fb2c",
          "0x0000000000000000000000000db321efaa9e380d0b37b55b530cdaa62728b9a3",
        ],
        index: 2,
      }),
      mock<types.Log>({
        topics: [
          "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
          "0x000000000000000000000000481e48ce19781c3ca573967216dee75fdcf70f54",
          "0x01000271e819e920185598bc6fb453dedd8425e0a1eb485958a12affccdea67a",
          "0x000000000000000000000000d144ca8aa2e7dfecd56a3cccba1cd873c8e5db58",
        ],
        index: 3,
      }),
    ];

    const transactionReceipt = mock<types.TransactionReceipt>({
      blockNumber: 10,
      hash: "transactionHash",
      from: "from",
    });

    beforeEach(() => {
      jest.spyOn(blockchainServiceMock, "getCode").mockResolvedValueOnce("bytecode1");
      jest.spyOn(blockchainServiceMock, "getCode").mockResolvedValueOnce("bytecode2");
    });

    it("gets byte code for deployed contracts", async () => {
      await addressService.getContractAddresses(logs, transactionReceipt);
      expect(blockchainServiceMock.getCode).toHaveBeenCalledTimes(2);
      expect(blockchainServiceMock.getCode).toHaveBeenCalledWith("0xdc187378edD8Ed1585fb47549Cc5fe633295d571");
      expect(blockchainServiceMock.getCode).toHaveBeenCalledWith("0xD144ca8Aa2E7DFECD56a3CCcBa1cd873c8e5db58");
    });

    it("returns contract addresses", async () => {
      const contractAddresses = await addressService.getContractAddresses(logs, transactionReceipt);
      expect(contractAddresses).toStrictEqual([
        {
          address: "0xdc187378edD8Ed1585fb47549Cc5fe633295d571",
          bytecode: "bytecode1",
          blockNumber: transactionReceipt.blockNumber,
          transactionHash: transactionReceipt.hash,
          creatorAddress: transactionReceipt.from,
          logIndex: logs[0].index,
        },
        {
          address: "0xD144ca8Aa2E7DFECD56a3CCcBa1cd873c8e5db58",
          bytecode: "bytecode2",
          blockNumber: transactionReceipt.blockNumber,
          transactionHash: transactionReceipt.hash,
          creatorAddress: transactionReceipt.from,
          logIndex: logs[2].index,
        },
      ]);
    });

    it("returns an empty array if no logs specified", async () => {
      const result = await addressService.getContractAddresses(null, transactionReceipt);
      expect(result).toStrictEqual([]);
    });
  });
});
