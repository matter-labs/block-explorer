import { Test, TestingModuleBuilder } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { BigNumber } from "ethers";
import { utils } from "zksync-web3";
import { ConfigService } from "@nestjs/config";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BalanceRepository } from "../repositories";
import { TokenType } from "../entities";
import { BalanceService } from "./";

describe("BalanceService", () => {
  let testingModuleBuilder: TestingModuleBuilder;
  let blockchainServiceMock: BlockchainService;
  let balanceRepositoryMock: BalanceRepository;
  let configServiceMock: ConfigService;
  let balanceService: BalanceService;

  let startDeleteOldBalancesDurationMetricMock: jest.Mock;
  let stopDeleteOldBalancesDurationMetricMock: jest.Mock;
  let startDeleteZeroBalancesDurationMetricMock: jest.Mock;
  let stopDeleteZeroBalancesDurationMetricMock: jest.Mock;

  beforeEach(async () => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(false),
    });

    blockchainServiceMock = mock<BlockchainService>();
    balanceRepositoryMock = mock<BalanceRepository>({
      deleteOldBalances: jest.fn().mockResolvedValue(null),
    });

    stopDeleteOldBalancesDurationMetricMock = jest.fn();
    startDeleteOldBalancesDurationMetricMock = jest.fn().mockReturnValue(stopDeleteOldBalancesDurationMetricMock);
    stopDeleteZeroBalancesDurationMetricMock = jest.fn();
    startDeleteZeroBalancesDurationMetricMock = jest.fn().mockReturnValue(stopDeleteZeroBalancesDurationMetricMock);

    testingModuleBuilder = Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: BalanceRepository,
          useValue: balanceRepositoryMock,
        },
        {
          provide: "PROM_METRIC_DELETE_OLD_BALANCES_DURATION_SECONDS",
          useValue: {
            startTimer: startDeleteOldBalancesDurationMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_DELETE_ZERO_BALANCES_DURATION_SECONDS",
          useValue: {
            startTimer: startDeleteZeroBalancesDurationMetricMock,
          },
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    });
    const app = await testingModuleBuilder.compile();

    app.useLogger(mock<Logger>());

    balanceService = app.get<BalanceService>(BalanceService);
  });

  describe("clearTrackedState", () => {
    const blockNumber = 10;
    const blockNumber2 = 15;

    beforeEach(() => {
      balanceService.changedBalances.set(
        blockNumber,
        new Map<string, Map<string, { balance: BigNumber; tokenType: TokenType }>>()
      );
      balanceService.changedBalances.set(
        blockNumber2,
        new Map<string, Map<string, { balance: BigNumber; tokenType: TokenType }>>()
      );
    });

    it("clears tracked balances for the specified block number", () => {
      balanceService.clearTrackedState(blockNumber);
      expect(balanceService.changedBalances.size).toBe(1);
      expect(balanceService.changedBalances.has(blockNumber2)).toBe(true);
    });
  });

  describe("trackChangedBalances", () => {
    const transfers = [
      mock<Transfer>({
        tokenAddress: "0x000000000000000000000000000000000000800a",
        from: "0x36615cf349d7f6344891b1e7ca7c72883f5dc049",
        to: "0x0000000000000000000000000000000000008001",
        blockNumber: 10,
        tokenType: TokenType.ETH,
      }),
      mock<Transfer>({
        tokenAddress: "0x000000000000000000000000000000000000800a",
        from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
        to: "0x0000000000000000000000000000000000008001",
        blockNumber: 10,
        tokenType: TokenType.ETH,
      }),
      mock<Transfer>({
        tokenAddress: "0x2392e98fb47cf05773144db3ce8002fac4f39c84",
        from: "0x0000000000000000000000000000000000000000",
        to: "0x36615cf349d7f6344891b1e7ca7c72883f5dc049",
        blockNumber: 10,
        tokenType: TokenType.ERC20,
      }),
    ];

    it("processes null as a transfers array", () => {
      balanceService.trackChangedBalances(null);
      expect(balanceService.changedBalances.size).toBe(0);
    });

    it("processes empty transfers array", () => {
      balanceService.trackChangedBalances([]);
      expect(balanceService.changedBalances.size).toBe(0);
    });

    it("does not track changed balance for 0x000 address", () => {
      const transfers = [
        mock<Transfer>({
          tokenAddress: "0x2392e98fb47cf05773144db3ce8002fac4f39c84",
          from: "0x000000000000000000000000000000000000800a",
          to: "0x0000000000000000000000000000000000008001",
          blockNumber: 10,
          tokenType: TokenType.ERC20,
        }),
        mock<Transfer>({
          tokenAddress: "0x000000000000000000000000000000000000800a",
          from: "0x000000000000000000000000000000000000800a",
          to: "0x0000000000000000000000000000000000008001",
          blockNumber: 10,
          tokenType: TokenType.ETH,
        }),
        mock<Transfer>({
          tokenAddress: "0x000000000000000000000000000000000000800a",
          from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
          to: "0x0000000000000000000000000000000000000000",
          blockNumber: 10,
          tokenType: TokenType.ETH,
        }),
        mock<Transfer>({
          tokenAddress: "0x2392e98fb47cf05773144db3ce8002fac4f39c84",
          from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
          to: "0x0000000000000000000000000000000000000000",
          blockNumber: 10,
          tokenType: TokenType.ERC20,
        }),
      ];

      balanceService.trackChangedBalances(transfers);
      expect(balanceService.changedBalances.has(transfers[0].blockNumber)).toBe(true);
      expect(balanceService.changedBalances.get(transfers[0].blockNumber).size).toBe(3);
      const blockChangedBalances = balanceService.changedBalances.get(transfers[0].blockNumber);
      expect(blockChangedBalances.has("0x0000000000000000000000000000000000008001")).toBe(true);
      expect(blockChangedBalances.has("0x000000000000000000000000000000000000800a")).toBe(true);
      expect(blockChangedBalances.has("0xd206eaf6819007535e893410cfa01885ce40e99a")).toBe(true);
      expect(blockChangedBalances.has("0x0000000000000000000000000000000000000000")).toBe(false);
      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008001")
          .has("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toBe(true);

      expect(
        blockChangedBalances
          .get("0x000000000000000000000000000000000000800a")
          .has("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toBe(true);

      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008001")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);

      expect(
        blockChangedBalances
          .get("0x000000000000000000000000000000000000800a")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);

      expect(
        blockChangedBalances
          .get("0xd206eaf6819007535e893410cfa01885ce40e99a")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);

      expect(
        blockChangedBalances
          .get("0xd206eaf6819007535e893410cfa01885ce40e99a")
          .has("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toBe(true);

      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008001")
          .get("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ERC20,
      });

      expect(
        blockChangedBalances
          .get("0x000000000000000000000000000000000000800a")
          .get("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ERC20,
      });

      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008001")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });

      expect(
        blockChangedBalances
          .get("0x000000000000000000000000000000000000800a")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });

      expect(
        blockChangedBalances
          .get("0xd206eaf6819007535e893410cfa01885ce40e99a")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });

      expect(
        blockChangedBalances
          .get("0xd206eaf6819007535e893410cfa01885ce40e99a")
          .get("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ERC20,
      });
    });

    it("tracks changed balance addresses for transfers", () => {
      balanceService.trackChangedBalances(transfers);
      expect(balanceService.changedBalances.has(transfers[0].blockNumber)).toBe(true);
      const blockChangedBalances = balanceService.changedBalances.get(transfers[0].blockNumber);
      expect(blockChangedBalances.size).toBe(3);
      expect(blockChangedBalances.has("0x0000000000000000000000000000000000008001")).toBe(true);
      expect(blockChangedBalances.has("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")).toBe(true);
      expect(blockChangedBalances.has("0xd206eaf6819007535e893410cfa01885ce40e99a")).toBe(true);
      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008001")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008001")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });
      expect(
        blockChangedBalances
          .get("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });
      expect(
        blockChangedBalances
          .get("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")
          .has("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")
          .get("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ERC20,
      });
      expect(
        blockChangedBalances
          .get("0xd206eaf6819007535e893410cfa01885ce40e99a")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0xd206eaf6819007535e893410cfa01885ce40e99a")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });
    });

    it("merge changed balances with existing changed balances for the block", () => {
      const existingBlockBalances = new Map<string, Map<string, { balance: BigNumber; tokenType: TokenType }>>();
      existingBlockBalances.set(
        "0x0000000000000000000000000000000000008007",
        new Map<string, { balance: BigNumber; tokenType: TokenType }>([
          ["0x000000000000000000000000000000000000800a", { balance: undefined, tokenType: TokenType.ETH }],
          ["0x0000000000000000000000000000000000008123", { balance: undefined, tokenType: TokenType.ERC20 }],
        ])
      );

      existingBlockBalances.set(
        "0x36615cf349d7f6344891b1e7ca7c72883f5dc049",
        new Map<string, { balance: BigNumber; tokenType: TokenType }>([
          ["0x000000000000000000000000000000000000800a", { balance: undefined, tokenType: TokenType.ETH }],
        ])
      );

      balanceService.changedBalances.set(transfers[0].blockNumber, existingBlockBalances);

      balanceService.trackChangedBalances(transfers);
      expect(balanceService.changedBalances.has(transfers[0].blockNumber)).toBe(true);
      const blockChangedBalances = balanceService.changedBalances.get(transfers[0].blockNumber);
      expect(blockChangedBalances.size).toBe(4);
      expect(blockChangedBalances.has("0x0000000000000000000000000000000000008007")).toBe(true);
      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008007")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008007")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });
      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008007")
          .has("0x0000000000000000000000000000000000008123")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008007")
          .get("0x0000000000000000000000000000000000008123")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ERC20,
      });
      expect(blockChangedBalances.has("0x0000000000000000000000000000000000008001")).toBe(true);
      expect(blockChangedBalances.has("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")).toBe(true);
      expect(blockChangedBalances.has("0xd206eaf6819007535e893410cfa01885ce40e99a")).toBe(true);
      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008001")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0x0000000000000000000000000000000000008001")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });
      expect(
        blockChangedBalances
          .get("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });
      expect(
        blockChangedBalances
          .get("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")
          .has("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0x36615cf349d7f6344891b1e7ca7c72883f5dc049")
          .get("0x2392e98fb47cf05773144db3ce8002fac4f39c84")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ERC20,
      });
      expect(
        blockChangedBalances
          .get("0xd206eaf6819007535e893410cfa01885ce40e99a")
          .has("0x000000000000000000000000000000000000800a")
      ).toBe(true);
      expect(
        blockChangedBalances
          .get("0xd206eaf6819007535e893410cfa01885ce40e99a")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.ETH,
      });
    });
  });

  describe("saveChangedBalances", () => {
    const blockNumber = 5;
    const addresses = ["36615cf349d7f6344891b1e7ca7c72883f5dc049", "0000000000000000000000000000000000008001"];

    const tokenAddresses = [
      ["0x0000000000000000000000000000000000008001", "0x000000000000000000000000000000000000800a"],
      ["0x36615cf349d7f6344891b1e7ca7c72883f5dc049", "0x000000000000000000000000000000000000800a"],
    ];

    beforeEach(() => {
      const blockBalances = new Map<string, Map<string, { balance: BigNumber; tokenType: TokenType }>>();
      blockBalances.set(
        utils.ETH_ADDRESS,
        new Map<string, { balance: BigNumber; tokenType: TokenType }>([
          [utils.ETH_ADDRESS, { balance: undefined, tokenType: TokenType.ETH }],
        ])
      );
      blockBalances.set(
        addresses[0],
        new Map<string, { balance: BigNumber; tokenType: TokenType }>([
          [tokenAddresses[0][0], { balance: undefined, tokenType: TokenType.ERC20 }],
          [tokenAddresses[0][1], { balance: undefined, tokenType: TokenType.ETH }],
        ])
      );
      blockBalances.set(
        addresses[1],
        new Map<string, { balance: BigNumber; tokenType: TokenType }>([
          [tokenAddresses[1][0], { balance: undefined, tokenType: TokenType.ERC20 }],
          [tokenAddresses[1][1], { balance: undefined, tokenType: TokenType.ETH }],
        ])
      );
      balanceService.changedBalances.set(blockNumber, blockBalances);

      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigNumber.from(1));
      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigNumber.from(2));
      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigNumber.from(3));
      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigNumber.from(4));
      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigNumber.from(5));
    });

    it("processes block number with no tracked balances", async () => {
      await balanceService.saveChangedBalances(blockNumber + 10);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledTimes(0);
    });

    it("requests balances from the blockchain service", async () => {
      await balanceService.saveChangedBalances(blockNumber);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledTimes(5);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(utils.ETH_ADDRESS, blockNumber, utils.ETH_ADDRESS);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(addresses[0], blockNumber, tokenAddresses[0][0]);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(addresses[0], blockNumber, tokenAddresses[0][1]);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(addresses[1], blockNumber, tokenAddresses[1][0]);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(addresses[1], blockNumber, tokenAddresses[1][1]);
    });

    it("saves balances to the DB", async () => {
      await balanceService.saveChangedBalances(blockNumber);
      expect(balanceRepositoryMock.addMany).toHaveBeenCalledTimes(1);
      expect(balanceRepositoryMock.addMany).toHaveBeenCalledWith([
        {
          address: utils.ETH_ADDRESS,
          tokenAddress: utils.ETH_ADDRESS,
          blockNumber,
          balance: BigNumber.from(1),
        },
        {
          address: addresses[0],
          tokenAddress: tokenAddresses[0][0],
          blockNumber,
          balance: BigNumber.from(2),
        },
        {
          address: addresses[0],
          tokenAddress: tokenAddresses[0][1],
          blockNumber,
          balance: BigNumber.from(3),
        },
        {
          address: addresses[1],
          tokenAddress: tokenAddresses[1][0],
          blockNumber,
          balance: BigNumber.from(4),
        },
        {
          address: addresses[1],
          tokenAddress: tokenAddresses[1][1],
          blockNumber,
          balance: BigNumber.from(5),
        },
      ]);
    });

    describe("when disableBalancesProcessing is true", () => {
      beforeEach(async () => {
        (configServiceMock.get as jest.Mock).mockReturnValue(true);
        const app = await testingModuleBuilder.compile();
        app.useLogger(mock<Logger>());
        balanceService = app.get<BalanceService>(BalanceService);

        const blockBalances = new Map<string, Map<string, { balance: BigNumber; tokenType: TokenType }>>();
        blockBalances.set(
          utils.ETH_ADDRESS,
          new Map<string, { balance: BigNumber; tokenType: TokenType }>([
            [utils.ETH_ADDRESS, { balance: undefined, tokenType: TokenType.ETH }],
          ])
        );
        blockBalances.set(
          addresses[1],
          new Map<string, { balance: BigNumber; tokenType: TokenType }>([
            [tokenAddresses[1][0], { balance: undefined, tokenType: TokenType.ERC20 }],
          ])
        );
        balanceService.changedBalances.set(blockNumber, blockBalances);
      });

      it("does not request balances from the blockchain service", async () => {
        await balanceService.saveChangedBalances(blockNumber);
        expect(blockchainServiceMock.getBalance).toHaveBeenCalledTimes(0);
      });

      it("saves balances to the DB with -1 balance", async () => {
        await balanceService.saveChangedBalances(blockNumber);
        expect(balanceRepositoryMock.addMany).toHaveBeenCalledTimes(1);
        expect(balanceRepositoryMock.addMany).toHaveBeenCalledWith([
          {
            address: utils.ETH_ADDRESS,
            tokenAddress: utils.ETH_ADDRESS,
            blockNumber,
            balance: BigNumber.from("-1"),
          },
          {
            address: addresses[1],
            tokenAddress: tokenAddresses[1][0],
            blockNumber,
            balance: BigNumber.from("-1"),
          },
        ]);
      });
    });

    describe("when some getBalance throw errors", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getBalance").mockReset();
        jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigNumber.from(1));
        jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigNumber.from(2));
        jest.spyOn(blockchainServiceMock, "getBalance").mockRejectedValueOnce("balanceOf function is not defined");
        jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigNumber.from(4));
        jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigNumber.from(5));
      });

      it("saves only successfully fetched balances to the DB", async () => {
        await balanceService.saveChangedBalances(blockNumber);
        expect(balanceRepositoryMock.addMany).toHaveBeenCalledTimes(1);
        expect(balanceRepositoryMock.addMany).toHaveBeenCalledWith([
          {
            address: utils.ETH_ADDRESS,
            tokenAddress: utils.ETH_ADDRESS,
            blockNumber,
            balance: BigNumber.from(1),
          },
          {
            address: addresses[0],
            tokenAddress: tokenAddresses[0][0],
            blockNumber,
            balance: BigNumber.from(2),
          },
          {
            address: addresses[1],
            tokenAddress: tokenAddresses[1][0],
            blockNumber,
            balance: BigNumber.from(4),
          },
          {
            address: addresses[1],
            tokenAddress: tokenAddresses[1][1],
            blockNumber,
            balance: BigNumber.from(5),
          },
        ]);
      });
    });
  });

  describe("getERC20TokensForChangedBalances", () => {
    it("returns empty array if there are no changed balances for the specified block number", () => {
      const blockNumber = 1;
      const blockBalances = new Map<string, Map<string, { balance: BigNumber; tokenType: TokenType }>>();
      blockBalances.set(
        "0x0000000000000000000000000000000000000001",
        new Map<string, { balance: BigNumber; tokenType: TokenType }>([
          [utils.ETH_ADDRESS, { balance: undefined, tokenType: TokenType.ETH }],
        ])
      );
      balanceService.changedBalances.set(blockNumber, blockBalances);
      expect(balanceService.getERC20TokensForChangedBalances(2)).toEqual([]);
    });
    it("returns unique ERC20 tokens addresses array for changed balances for specified block number", async () => {
      const blockNumber = 1;
      const blockBalances = new Map<string, Map<string, { balance: BigNumber; tokenType: TokenType }>>();
      blockBalances.set(
        "0x0000000000000000000000000000000000000001",
        new Map<string, { balance: BigNumber; tokenType: TokenType }>([
          [utils.ETH_ADDRESS, { balance: undefined, tokenType: TokenType.ETH }],
          ["0x0000000000000000000000000000000000000002", { balance: undefined, tokenType: TokenType.ERC20 }],
          ["0x0000000000000000000000000000000000000003", { balance: undefined, tokenType: TokenType.ERC20 }],
        ])
      );
      blockBalances.set(
        "0x0000000000000000000000000000000000000005",
        new Map<string, { balance: BigNumber; tokenType: TokenType }>([
          [utils.ETH_ADDRESS, { balance: undefined, tokenType: TokenType.ETH }],
          ["0x0000000000000000000000000000000000000002", { balance: undefined, tokenType: TokenType.ERC20 }],
        ])
      );
      balanceService.changedBalances.set(blockNumber, blockBalances);
      expect(balanceService.getERC20TokensForChangedBalances(blockNumber)).toEqual([
        "0x0000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000003",
      ]);
    });
  });

  describe("deleteOldBalances", () => {
    const fromBlockNumber = 10;
    const toBlockNumber = 10;
    it("starts delete old balances metric timer", async () => {
      await balanceService.deleteOldBalances(fromBlockNumber, toBlockNumber);
      expect(startDeleteOldBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("calls repository to delete old balances", async () => {
      await balanceService.deleteOldBalances(fromBlockNumber, toBlockNumber);
      expect(balanceRepositoryMock.deleteOldBalances).toHaveBeenCalledTimes(1);
      expect(balanceRepositoryMock.deleteOldBalances).toHaveBeenCalledWith(fromBlockNumber, toBlockNumber);
    });

    describe("when repository call succeeds", () => {
      it("stops delete old balances metric timer", async () => {
        await balanceService.deleteOldBalances(fromBlockNumber, toBlockNumber);
        expect(stopDeleteOldBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });

    describe("when repository call fails", () => {
      it("stops delete old balances metric timer", async () => {
        (balanceRepositoryMock.deleteOldBalances as jest.Mock).mockRejectedValueOnce(new Error("error"));

        await balanceService.deleteOldBalances(fromBlockNumber, toBlockNumber);
        expect(stopDeleteOldBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("deleteZeroBalances", () => {
    const fromBlockNumber = 10;
    const toBlockNumber = 10;
    it("starts delete zero balances metric timer", async () => {
      await balanceService.deleteZeroBalances(fromBlockNumber, toBlockNumber);
      expect(startDeleteZeroBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("calls repository to delete zero balances", async () => {
      await balanceService.deleteZeroBalances(fromBlockNumber, toBlockNumber);
      expect(balanceRepositoryMock.deleteZeroBalances).toHaveBeenCalledTimes(1);
      expect(balanceRepositoryMock.deleteZeroBalances).toHaveBeenCalledWith(fromBlockNumber, toBlockNumber);
    });

    describe("when repository call succeeds", () => {
      it("stops delete zero balances metric timer", async () => {
        await balanceService.deleteZeroBalances(fromBlockNumber, toBlockNumber);
        expect(stopDeleteZeroBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });

    describe("when repository call fails", () => {
      it("stops delete zero balances metric timer", async () => {
        (balanceRepositoryMock.deleteZeroBalances as jest.Mock).mockRejectedValueOnce(new Error("error"));

        await balanceService.deleteZeroBalances(fromBlockNumber, toBlockNumber);
        expect(stopDeleteZeroBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("getDeleteBalancesFromBlockNumber", () => {
    beforeEach(() => {
      (balanceRepositoryMock.getDeleteBalancesFromBlockNumber as jest.Mock).mockResolvedValue(10);
    });

    it("returns getDeleteBalancesFromBlockNumber value from the repository", async () => {
      const result = await balanceService.getDeleteBalancesFromBlockNumber();
      expect(result).toBe(10);
    });
  });

  describe("setDeleteBalancesFromBlockNumber", () => {
    it("sets fromBlockNumber for deleteBalance service", async () => {
      await balanceService.setDeleteBalancesFromBlockNumber(10);
      expect(balanceRepositoryMock.setDeleteBalancesFromBlockNumber).toHaveBeenCalledTimes(1);
      expect(balanceRepositoryMock.setDeleteBalancesFromBlockNumber).toHaveBeenCalledWith(10);
    });
  });
});
