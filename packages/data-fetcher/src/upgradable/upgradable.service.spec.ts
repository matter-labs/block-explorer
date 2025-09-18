import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { types } from "zksync-ethers";

import { UpgradableService } from "./upgradable.service";
describe("UpgradableService", () => {
  let upgradableService: UpgradableService;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [UpgradableService],
    }).compile();

    app.useLogger(mock<Logger>());

    upgradableService = app.get<UpgradableService>(UpgradableService);
  });

  describe("getUpgradableAddresses", () => {
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
          "0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b",
          "0x0000000000000000000000000db321efaa9e380d0b37b55b530cdaa62728b9a3",
        ],
        address: "0xdc187378edD8Ed1585fb47549Cc5fe633295d571",
        index: 2,
      }),
      mock<types.Log>({
        topics: [
          "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0",
          "0x000000000000000000000000481e48ce19781c3ca573967216dee75fdcf70f54",
        ],
        address: "0xD144ca8Aa2E7DFECD56a3CCcBa1cd873c8e5db58",
        index: 3,
      }),
    ];

    const transactionReceipt = mock<types.TransactionReceipt>({
      blockNumber: 10,
      hash: "transactionHash",
      from: "from",
    });

    it("returns upgradable addresses", async () => {
      const upgradableAddresses = await upgradableService.getUpgradableAddresses(logs, transactionReceipt);
      expect(upgradableAddresses).toStrictEqual([
        {
          address: "0xdc187378edD8Ed1585fb47549Cc5fe633295d571",
          implementationAddress: "0x0Db321EFaa9E380d0B37B55B530CDaA62728B9a3",
          blockNumber: transactionReceipt.blockNumber,
          transactionHash: transactionReceipt.hash,
          creatorAddress: transactionReceipt.from,
          logIndex: logs[1].index,
        },
        {
          address: "0xD144ca8Aa2E7DFECD56a3CCcBa1cd873c8e5db58",
          implementationAddress: "0x481E48Ce19781c3cA573967216deE75FDcF70F54",
          blockNumber: transactionReceipt.blockNumber,
          transactionHash: transactionReceipt.hash,
          creatorAddress: transactionReceipt.from,
          logIndex: logs[2].index,
        },
      ]);
    });

    it("returns an empty array if no logs specified", async () => {
      const result = await upgradableService.getUpgradableAddresses(null, transactionReceipt);
      expect(result).toStrictEqual([]);
    });
  });
});
