import { Test, TestingModuleBuilder } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { TokenType } from "../token/token.service";
import { NftService } from "./nft.service";
import { JsonRpcProviderBase } from "../rpcProvider";
import { Contract } from "ethers";

jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers");
  return {
    ...originalModule,
    Contract: jest.fn().mockImplementation(() => ({
      tokenURI: jest.fn().mockResolvedValue("https://token-uri.com"),
    })),
  };
});

describe("NftItemService", () => {
  let testingModuleBuilder: TestingModuleBuilder;
  let providerMock: JsonRpcProviderBase;
  let nftService: NftService;

  beforeEach(async () => {
    providerMock = mock<JsonRpcProviderBase>();

    testingModuleBuilder = Test.createTestingModule({
      providers: [
        NftService,
        {
          provide: JsonRpcProviderBase,
          useValue: providerMock,
        },
      ],
    });
    const app = await testingModuleBuilder.compile();

    app.useLogger(mock<Logger>());

    nftService = app.get<NftService>(NftService);
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        name: "Token",
        description: "Token description",
        image: "ipfs://qrwqfsafasga",
      }),
    });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe("clearTrackedState", () => {
    const blockNumber = 10;
    const blockNumber2 = 15;

    beforeEach(() => {
      nftService.allNfts.set(
        blockNumber,
        new Map<
          string,
          {
            timestamp: Date;
            owner: string;
          }
        >()
      );
      nftService.allNfts.set(
        blockNumber2,
        new Map<
          string,
          {
            timestamp: Date;
            owner: string;
          }
        >()
      );
    });

    it("clears tracked nft items for the specified block number", () => {
      nftService.clearTrackedState(blockNumber);
      expect(nftService.allNfts.size).toBe(1);
      expect(nftService.allNfts.has(blockNumber2)).toBe(true);
    });
  });

  describe("trackNftItems", () => {
    const transfers = [
      mock<Transfer>({
        tokenAddress: "0x000000000000000000000000000000000000800a",
        from: "0x36615cf349d7f6344891b1e7ca7c72883f5dc049",
        to: "0x0000000000000000000000000000000000008001",
        blockNumber: 10,
        tokenType: TokenType.BaseToken,
      }),
      mock<Transfer>({
        tokenAddress: "0x000000000000000000000000000000000000F004",
        from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
        fields: { tokenId: BigInt(1) },
        to: "0x0000000000000000000000000000000000008001",
        blockNumber: 10,
        tokenType: TokenType.ERC721,
        timestamp: new Date(2022, 1, 1),
      }),
      mock<Transfer>({
        tokenAddress: "0x2392e98fb47cf05773144db3ce8002fac4f39c84",
        from: "0x0000000000000000000000000000000000000000",
        to: "0x36615cf349d7f6344891b1e7ca7c72883f5dc049",
        blockNumber: 10,
        tokenType: TokenType.ERC20,
      }),
      mock<Transfer>({
        tokenAddress: "0x2392e98fb47cf05773144db3ce8002fac4f39c94",
        from: "0x00000000000000000000000000000000000000b2",
        fields: { tokenId: BigInt(1) },
        to: "0x36615cf349d7f6344891b1e7ca7c72883f5dc049",
        blockNumber: 10,
        tokenType: TokenType.ERC721,
      }),
      mock<Transfer>({
        tokenAddress: "0x000000000000000000000000000000000000F004",
        from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
        fields: { tokenId: BigInt(2) },
        to: "0x36615cf349d7f6344891b1e7ca7c72883f5dc049",
        blockNumber: 10,
        tokenType: TokenType.ERC721,
        timestamp: new Date(2021, 1, 1),
      }),
    ];

    it("processes null as a transfers array", () => {
      nftService.trackNftItems(null);
      expect(nftService.allNfts.size).toBe(0);
    });

    it("processes empty transfers array", () => {
      nftService.trackNftItems([]);
      expect(nftService.allNfts.size).toBe(0);
    });

    it("does not track changed nft items for not ERC721 transfers", () => {
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

      nftService.trackNftItems(transfers);
      expect(nftService.allNfts.size).toBe(0);
      expect(nftService.allNfts.has(transfers[0].blockNumber)).toBe(false);
    });

    it("tracks changed balance addresses for transfers", () => {
      nftService.trackNftItems(transfers);
      expect(nftService.allNfts.has(transfers[0].blockNumber)).toBe(true);
      const blockChangedNftItems = nftService.allNfts.get(transfers[0].blockNumber);
      expect(blockChangedNftItems.size).toBe(3);
      expect(blockChangedNftItems.has("0x000000000000000000000000000000000000F004-1")).toBe(true);
      expect(blockChangedNftItems.has("0x000000000000000000000000000000000000F004-2")).toBe(true);
      expect(blockChangedNftItems.has("0x2392e98fb47cf05773144db3ce8002fac4f39c94-1")).toBe(true);
      expect(blockChangedNftItems.get("0x000000000000000000000000000000000000F004-1")).toEqual({
        timestamp: transfers[1].timestamp,
        owner: transfers[1].to,
      });
      expect(blockChangedNftItems.get("0x000000000000000000000000000000000000F004-2")).toEqual({
        timestamp: transfers[4].timestamp,
        owner: transfers[4].to,
      });
      expect(blockChangedNftItems.get("0x2392e98fb47cf05773144db3ce8002fac4f39c94-1")).toEqual({
        timestamp: transfers[3].timestamp,
        owner: transfers[3].to,
      });
    });

    it("updates tracked nft items for the same token address and token id", () => {
      const newTransfers = [
        ...transfers,
        mock<Transfer>({
          tokenAddress: "0x000000000000000000000000000000000000F004",
          from: "0xd206eaf6819007535e893410cfa01885ce40e99a",
          fields: { tokenId: BigInt(2) },
          to: "0x2392e98fb47cf05773144db3ce8002fac4f39c94",
          blockNumber: 10,
          tokenType: TokenType.ERC721,
          timestamp: new Date(2020, 1, 1),
        }),
      ];

      nftService.trackNftItems(newTransfers);
      expect(nftService.allNfts.has(newTransfers[0].blockNumber)).toBe(true);
      const blockChangedNftItems = nftService.allNfts.get(newTransfers[0].blockNumber);
      expect(blockChangedNftItems.size).toBe(3);
      expect(blockChangedNftItems.has("0x000000000000000000000000000000000000F004-1")).toBe(true);
      expect(blockChangedNftItems.has("0x000000000000000000000000000000000000F004-2")).toBe(true);
      expect(blockChangedNftItems.has("0x2392e98fb47cf05773144db3ce8002fac4f39c94-1")).toBe(true);
      expect(blockChangedNftItems.get("0x000000000000000000000000000000000000F004-1")).toEqual({
        timestamp: transfers[1].timestamp,
        owner: transfers[1].to,
      });
      expect(blockChangedNftItems.get("0x000000000000000000000000000000000000F004-2")).toEqual({
        timestamp: transfers[4].timestamp,
        owner: transfers[4].to,
      });
      expect(blockChangedNftItems.get("0x2392e98fb47cf05773144db3ce8002fac4f39c94-1")).toEqual({
        timestamp: transfers[3].timestamp,
        owner: transfers[3].to,
      });
    });
  });

  describe("getNftItems", () => {
    const blockNumber = 5;
    const addresses = ["36615cf349d7f6344891b1e7ca7c72883f5dc049", "0000000000000000000000000000000000008001"];

    const tokenAddresses = ["0x000000000000000000000000000000000000F004", "0x2392e98fb47cf05773144db3ce8002fac4f39c94"];

    beforeEach(() => {
      const allNfts = new Map<string, { timestamp: Date; owner: string }>();
      allNfts.set("0x000000000000000000000000000000000000F004-1", {
        timestamp: new Date(2022, 1, 1),
        owner: addresses[0],
      });
      allNfts.set("0x2392e98fb47cf05773144db3ce8002fac4f39c94-1", {
        timestamp: new Date(2021, 1, 1),
        owner: addresses[0],
      });
      nftService.allNfts = new Map<number, Map<string, { timestamp: Date; owner: string }>>();
      nftService.allNfts.set(blockNumber, allNfts);
    });

    it("processes block number with no tracked balances", async () => {
      const changedNfts = await nftService.getNftItems(blockNumber + 50);
      expect(changedNfts).toHaveLength(0);
    });

    it("requests metadata from the chain with ipfs url", async () => {
      const nfts = await nftService.getNftItems(blockNumber);
      expect(nfts).toHaveLength(2);
      expect(nfts[0]).toEqual({
        tokenAddress: tokenAddresses[0],
        owner: addresses[0],
        tokenId: "1",
        name: "Token",
        description: "Token description",
        imageUrl: "https://ipfs.io/ipfs/qrwqfsafasga",
        metadataUrl: "https://token-uri.com",
      });
      expect(nfts[1]).toEqual({
        tokenAddress: tokenAddresses[1],
        owner: addresses[0],
        tokenId: "1",
        name: "Token",
        description: "Token description",
        imageUrl: "https://ipfs.io/ipfs/qrwqfsafasga",
        metadataUrl: "https://token-uri.com",
      });
    });

    it("requests metadata from the chain with normal url", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          name: "Token",
          description: "Token description",
          image: "https://token-uri.com/image",
        }),
      });
      const nfts = await nftService.getNftItems(blockNumber);
      expect(nfts).toHaveLength(2);
      expect(nfts[0]).toEqual({
        tokenAddress: tokenAddresses[0],
        owner: addresses[0],
        tokenId: "1",
        name: "Token",
        description: "Token description",
        imageUrl: "https://token-uri.com/image",
        metadataUrl: "https://token-uri.com",
      });
      expect(nfts[1]).toEqual({
        tokenAddress: tokenAddresses[1],
        owner: addresses[0],
        tokenId: "1",
        name: "Token",
        description: "Token description",
        imageUrl: "https://token-uri.com/image",
        metadataUrl: "https://token-uri.com",
      });
    });

    it("returns nft item with ipfs token uri", async () => {
      (Contract as jest.Mock).mockImplementation(() => ({
        tokenURI: jest.fn().mockResolvedValue("ipfs://someipshash"),
      }));

      const nfts = await nftService.getNftItems(blockNumber);
      expect(nfts).toHaveLength(2);
      expect(nfts[0]).toEqual({
        tokenAddress: tokenAddresses[0],
        owner: addresses[0],
        tokenId: "1",
        name: "Token",
        description: "Token description",
        imageUrl: "https://ipfs.io/ipfs/qrwqfsafasga",
        metadataUrl: "ipfs://someipshash",
      });
      expect(nfts[1]).toEqual({
        tokenAddress: tokenAddresses[1],
        owner: addresses[0],
        tokenId: "1",
        name: "Token",
        description: "Token description",
        imageUrl: "https://ipfs.io/ipfs/qrwqfsafasga",
        metadataUrl: "ipfs://someipshash",
      });
    });

    describe("when tokenURI throws a error", () => {
      beforeEach(() => {
        (Contract as jest.Mock).mockImplementation(() => ({
          tokenURI: jest.fn().mockRejectedValue(new Error("Failed to fetch")),
        }));
        const allNfts = new Map<string, { timestamp: Date; owner: string }>();
        allNfts.set("0x000000000000000000000000000000000000F004-1", {
          timestamp: new Date(2022, 1, 1),
          owner: addresses[0],
        });
        nftService.allNfts = new Map<number, Map<string, { timestamp: Date; owner: string }>>();
        nftService.allNfts.set(blockNumber, allNfts);
      });

      it("returns only successfully fetched nft items", async () => {
        const changedNfts = await nftService.getNftItems(blockNumber);
        expect(changedNfts).toHaveLength(1);
        expect(changedNfts[0]).toEqual({
          tokenAddress: tokenAddresses[0],
          owner: addresses[0],
          tokenId: "1",
          name: undefined,
          description: undefined,
          imageUrl: undefined,
          metadataUrl: null,
        });
      });
    });

    describe("when metadata fetch throws a error", () => {
      beforeEach(() => {
        (Contract as jest.Mock).mockImplementation(() => ({
          tokenURI: jest.fn().mockResolvedValue("https://token-uri.com"),
        }));
        global.fetch = jest.fn().mockRejectedValueOnce(new Error("Failed to fetch"));
        const allNfts = new Map<string, { timestamp: Date; owner: string }>();
        allNfts.set("0x000000000000000000000000000000000000F004-1", {
          timestamp: new Date(2022, 1, 1),
          owner: addresses[0],
        });
        nftService.allNfts = new Map<number, Map<string, { timestamp: Date; owner: string }>>();
        nftService.allNfts.set(blockNumber, allNfts);
      });

      it("returns only successfully fetched nft items", async () => {
        const changedNfts = await nftService.getNftItems(blockNumber);
        expect(changedNfts).toHaveLength(1);
        expect(changedNfts[0]).toEqual({
          tokenAddress: tokenAddresses[0],
          owner: addresses[0],
          tokenId: "1",
          name: undefined,
          description: undefined,
          imageUrl: undefined,
          metadataUrl: "https://token-uri.com",
        });
      });
    });
  });
});
