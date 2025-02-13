import { mock } from "jest-mock-extended";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { NftItemService } from "./nftItem.service";
import { NftItemRepository } from "../repositories/nftItem.repository";

describe("NftItemServide", () => {
  let nftItemService: NftItemService;
  const nftItemRepository: NftItemRepository = mock<NftItemRepository>();
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        NftItemService,
        {
          provide: NftItemRepository,
          useValue: nftItemRepository,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    nftItemService = app.get<NftItemService>(NftItemService);
  });

  describe("saveNftItem", () => {
    afterAll(() => {
      jest.clearAllMocks();
    });

    it("should save nft item", async () => {
      const nftItem = {
        tokenId: "1",
        tokenAddress: "0x123",
        owner: "0x123",
      };
      await nftItemService.saveNftItem(nftItem);
      expect(nftItemRepository.upsert).toBeCalledTimes(1);
    });
  });

  describe("saveNftItems", () => {
    afterAll(() => {
      jest.clearAllMocks();
    });

    it("should save nft items", async () => {
      const nftItems = [
        {
          tokenId: "1",
          tokenAddress: "0x123",
          owner: "0x123",
        },
        {
          tokenId: "2",
          tokenAddress: "0x123",
          owner: "0x123",
        },
      ];
      await nftItemService.saveNftItems(nftItems);
      expect(nftItemRepository.upsert).toBeCalledTimes(2);
    });
  });
});
