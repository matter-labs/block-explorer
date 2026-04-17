import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { IndexerStateService } from "./indexerState.service";
import { IndexerState } from "./indexerState.entity";

describe("IndexerStateService", () => {
  let service: IndexerStateService;
  let repositoryMock: Repository<IndexerState>;

  beforeEach(async () => {
    repositoryMock = mock<Repository<IndexerState>>();
    (repositoryMock.findOne as jest.Mock).mockResolvedValue({ id: 1, lastReadyBlockNumber: 500 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndexerStateService,
        {
          provide: getRepositoryToken(IndexerState),
          useValue: repositoryMock,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(1000) },
        },
      ],
    }).compile();

    service = module.get<IndexerStateService>(IndexerStateService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getLastReadyBlockNumber", () => {
    it("fetches from DB on first call", async () => {
      const result = await service.getLastReadyBlockNumber();
      expect(result).toBe(500);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({ where: {} });
    });

    it("returns cached value on subsequent calls within TTL", async () => {
      await service.getLastReadyBlockNumber();
      const result = await service.getLastReadyBlockNumber();
      expect(result).toBe(500);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
    });

    it("re-fetches after TTL expires", async () => {
      await service.getLastReadyBlockNumber();
      jest.spyOn(Date, "now").mockReturnValue(Date.now() + 2000);
      (repositoryMock.findOne as jest.Mock).mockResolvedValue({ id: 1, lastReadyBlockNumber: 600 });

      const result = await service.getLastReadyBlockNumber();
      expect(result).toBe(600);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(2);
    });

    it("deduplicates concurrent calls", async () => {
      const [result1, result2] = await Promise.all([
        service.getLastReadyBlockNumber(),
        service.getLastReadyBlockNumber(),
      ]);
      expect(result1).toBe(500);
      expect(result2).toBe(500);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
    });

    it("returns 0 when no state row exists", async () => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.getLastReadyBlockNumber();
      expect(result).toBe(0);
    });

    it("throws when DB call fails", async () => {
      (repositoryMock.findOne as jest.Mock).mockRejectedValue(new Error("DB error"));
      await expect(service.getLastReadyBlockNumber()).rejects.toThrow("DB error");
    });
  });
});
