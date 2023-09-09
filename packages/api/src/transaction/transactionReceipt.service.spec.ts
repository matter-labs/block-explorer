import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { TransactionReceiptService } from "./transactionReceipt.service";
import { TransactionReceipt } from "./entities/transactionReceipt.entity";

describe("TransactionReceiptService", () => {
  let service: TransactionReceiptService;
  let repositoryMock: Repository<TransactionReceipt>;

  beforeEach(async () => {
    repositoryMock = mock<Repository<TransactionReceipt>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionReceiptService,
        {
          provide: getRepositoryToken(TransactionReceipt),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<TransactionReceiptService>(TransactionReceiptService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("findOne", () => {
    let queryBuilderMock;
    const transactionHash = "transactionHash";
    let transactionReceipt: TransactionReceipt;

    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<TransactionReceipt>>();
      transactionReceipt = mock<TransactionReceipt>({ transactionHash });
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
      (queryBuilderMock.getOne as jest.Mock).mockReturnValue(transactionReceipt);
    });

    it("creates query builder with proper params", async () => {
      await service.findOne(transactionHash);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("transactionReceipt");
    });

    it("filters transaction receipt by the specified transactionHash", async () => {
      await service.findOne(transactionHash);
      expect(queryBuilderMock.where).toHaveBeenCalledWith({ transactionHash });
    });

    describe("when fields to select are specified", () => {
      it("specifies fields to select in the query", async () => {
        await service.findOne(transactionHash, ["from", "contractAddress"]);
        expect(queryBuilderMock.select).toHaveBeenCalledWith([
          "transactionReceipt.from",
          "transactionReceipt.contractAddress",
        ]);
      });

      it("returns transaction receipt", async () => {
        const result = await service.findOne(transactionHash, ["from", "contractAddress"]);
        expect(result).toBe(transactionReceipt);
      });
    });

    it("returns transaction receipt", async () => {
      const result = await service.findOne(transactionHash);
      expect(result).toBe(transactionReceipt);
    });
  });
});
