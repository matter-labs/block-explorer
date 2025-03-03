import { Test, TestingModuleBuilder } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { utils } from "zksync-ethers";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { BlockchainService } from "../blockchain/blockchain.service";
import { TokenType } from "../token/token.service";
import { BalanceService } from "./";

describe("BalanceService", () => {
  let testingModuleBuilder: TestingModuleBuilder;
  let blockchainServiceMock: BlockchainService;
  let balanceService: BalanceService;

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>();

    testingModuleBuilder = Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
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
        new Map<string, Map<string, { balance: bigint; tokenType: TokenType }>>()
      );
      balanceService.changedBalances.set(
        blockNumber2,
        new Map<string, Map<string, { balance: bigint; tokenType: TokenType }>>()
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
        tokenType: TokenType.BaseToken,
      }),
      mock<Transfer>({
        tokenAddress: "0x000000000000000000000000000000000000800a",
        from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
        to: "0x0000000000000000000000000000000000008001",
        blockNumber: 10,
        tokenType: TokenType.BaseToken,
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
          tokenType: TokenType.BaseToken,
        }),
        mock<Transfer>({
          tokenAddress: "0x000000000000000000000000000000000000800a",
          from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
          to: "0x0000000000000000000000000000000000000000",
          blockNumber: 10,
          tokenType: TokenType.BaseToken,
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
        tokenType: TokenType.BaseToken,
      });

      expect(
        blockChangedBalances
          .get("0x000000000000000000000000000000000000800a")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.BaseToken,
      });

      expect(
        blockChangedBalances
          .get("0xd206eaf6819007535e893410cfa01885ce40e99a")
          .get("0x000000000000000000000000000000000000800a")
      ).toEqual({
        balance: undefined,
        tokenType: TokenType.BaseToken,
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
        tokenType: TokenType.BaseToken,
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
        tokenType: TokenType.BaseToken,
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
        tokenType: TokenType.BaseToken,
      });
    });

    it("merge changed balances with existing changed balances for the block", () => {
      const existingBlockBalances = new Map<string, Map<string, { balance: bigint; tokenType: TokenType }>>();
      existingBlockBalances.set(
        "0x0000000000000000000000000000000000008007",
        new Map<string, { balance: bigint; tokenType: TokenType }>([
          ["0x000000000000000000000000000000000000800a", { balance: undefined, tokenType: TokenType.BaseToken }],
          ["0x0000000000000000000000000000000000008123", { balance: undefined, tokenType: TokenType.ERC20 }],
        ])
      );

      existingBlockBalances.set(
        "0x36615cf349d7f6344891b1e7ca7c72883f5dc049",
        new Map<string, { balance: bigint; tokenType: TokenType }>([
          ["0x000000000000000000000000000000000000800a", { balance: undefined, tokenType: TokenType.BaseToken }],
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
        tokenType: TokenType.BaseToken,
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
        tokenType: TokenType.BaseToken,
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
        tokenType: TokenType.BaseToken,
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
        tokenType: TokenType.BaseToken,
      });
    });
  });

  describe("getChangedBalances", () => {
    const blockNumber = 5;
    const addresses = ["36615cf349d7f6344891b1e7ca7c72883f5dc049", "0000000000000000000000000000000000008001"];

    const tokenAddresses = [
      ["0x0000000000000000000000000000000000008001", "0x000000000000000000000000000000000000800a"],
      ["0x36615cf349d7f6344891b1e7ca7c72883f5dc049", "0x000000000000000000000000000000000000800a"],
    ];

    beforeEach(() => {
      const blockBalances = new Map<string, Map<string, { balance: bigint; tokenType: TokenType }>>();
      blockBalances.set(
        utils.ETH_ADDRESS,
        new Map<string, { balance: bigint; tokenType: TokenType }>([
          [utils.ETH_ADDRESS, { balance: undefined, tokenType: TokenType.BaseToken }],
        ])
      );
      blockBalances.set(
        addresses[0],
        new Map<string, { balance: bigint; tokenType: TokenType }>([
          [tokenAddresses[0][0], { balance: undefined, tokenType: TokenType.ERC20 }],
          [tokenAddresses[0][1], { balance: undefined, tokenType: TokenType.BaseToken }],
        ])
      );
      blockBalances.set(
        addresses[1],
        new Map<string, { balance: bigint; tokenType: TokenType }>([
          [tokenAddresses[1][0], { balance: undefined, tokenType: TokenType.ERC20 }],
          [tokenAddresses[1][1], { balance: undefined, tokenType: TokenType.BaseToken }],
        ])
      );
      balanceService.changedBalances.set(blockNumber, blockBalances);

      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigInt(1));
      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigInt(2));
      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigInt(3));
      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigInt(4));
      jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigInt(5));
    });

    it("processes block number with no tracked balances", async () => {
      await balanceService.getChangedBalances(blockNumber + 10);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledTimes(0);
    });

    it("requests balances from the blockchain service", async () => {
      await balanceService.getChangedBalances(blockNumber);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledTimes(5);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(utils.ETH_ADDRESS, blockNumber, utils.ETH_ADDRESS);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(addresses[0], blockNumber, tokenAddresses[0][0]);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(addresses[0], blockNumber, tokenAddresses[0][1]);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(addresses[1], blockNumber, tokenAddresses[1][0]);
      expect(blockchainServiceMock.getBalance).toHaveBeenCalledWith(addresses[1], blockNumber, tokenAddresses[1][1]);
    });

    it("returns changed balances", async () => {
      const changedBalances = await balanceService.getChangedBalances(blockNumber);
      expect(changedBalances).toEqual([
        {
          address: "0x0000000000000000000000000000000000000000",
          blockNumber: 5,
          tokenAddress: "0x0000000000000000000000000000000000000000",
          balance: BigInt(1),
          tokenType: TokenType.BaseToken,
        },
        {
          address: addresses[0],
          blockNumber: 5,
          tokenAddress: tokenAddresses[0][0],
          balance: BigInt(2),
          tokenType: TokenType.ERC20,
        },
        {
          address: addresses[0],
          blockNumber: 5,
          tokenAddress: tokenAddresses[0][1],
          balance: BigInt(3),
          tokenType: TokenType.BaseToken,
        },
        {
          address: addresses[1],
          blockNumber: 5,
          tokenAddress: tokenAddresses[1][0],
          balance: BigInt(4),
          tokenType: TokenType.ERC20,
        },
        {
          address: addresses[1],
          blockNumber: 5,
          tokenAddress: tokenAddresses[1][1],
          balance: BigInt(5),
          tokenType: TokenType.BaseToken,
        },
      ]);
    });

    describe("when some getBalance throw errors", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getBalance").mockReset();
        jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigInt(1));
        jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigInt(2));
        jest.spyOn(blockchainServiceMock, "getBalance").mockRejectedValueOnce("balanceOf function is not defined");
        jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigInt(4));
        jest.spyOn(blockchainServiceMock, "getBalance").mockResolvedValueOnce(BigInt(5));
      });

      it("returns only successfully fetched balances", async () => {
        const changedBalances = await balanceService.getChangedBalances(blockNumber);
        expect(changedBalances).toEqual([
          {
            address: "0x0000000000000000000000000000000000000000",
            blockNumber: 5,
            tokenAddress: "0x0000000000000000000000000000000000000000",
            balance: BigInt(1),
            tokenType: TokenType.BaseToken,
          },
          {
            address: addresses[0],
            blockNumber: 5,
            tokenAddress: tokenAddresses[0][0],
            balance: BigInt(2),
            tokenType: TokenType.ERC20,
          },
          {
            address: addresses[1],
            blockNumber: 5,
            tokenAddress: tokenAddresses[1][0],
            balance: BigInt(4),
            tokenType: TokenType.ERC20,
          },
          {
            address: addresses[1],
            blockNumber: 5,
            tokenAddress: tokenAddresses[1][1],
            balance: BigInt(5),
            tokenType: TokenType.BaseToken,
          },
        ]);
      });
    });
  });
});
