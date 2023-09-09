import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { NotFoundException } from "@nestjs/common";
import { Pagination } from "nestjs-typeorm-paginate";
import { BatchController } from "./batch.controller";
import { BatchService } from "./batch.service";
import { Batch } from "./batch.entity";
import { BatchDetails } from "./batchDetails.entity";
import { PagingOptionsDto } from "../common/dtos";
import { buildDateFilter } from "../common/utils";

jest.mock("../common/utils", () => ({
  buildDateFilter: jest.fn().mockReturnValue({ timestamp: "timestamp" }),
}));

describe("BatchController", () => {
  const batch = mock<BatchDetails>({
    number: 10,
  });

  let controller: BatchController;
  let serviceMock: BatchService;

  beforeEach(async () => {
    serviceMock = mock<BatchService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchController],
      providers: [
        {
          provide: BatchService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<BatchController>(BatchController);
  });

  describe("getBatches", () => {
    const batches = mock<Pagination<Batch>>();
    beforeEach(() => {
      (serviceMock.findAll as jest.Mock).mockResolvedValueOnce(batches);
    });

    it("queries and returns batches with the specified options", async () => {
      const listFilterOptions = {
        fromDate: "2023-02-08T15:34:46.251Z",
        toDate: "2023-02-08T17:34:46.251Z",
      };
      const pagingOptions: PagingOptionsDto = { limit: 10, page: 2 };
      const result = await controller.getBatches(listFilterOptions, pagingOptions);

      expect(buildDateFilter).toHaveBeenCalledWith(listFilterOptions.fromDate, listFilterOptions.toDate);
      expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
      expect(serviceMock.findAll).toHaveBeenCalledWith(
        { timestamp: "timestamp" },
        { ...pagingOptions, filterOptions: listFilterOptions, route: "batches", canUseNumberFilterAsOffset: true }
      );
      expect(result).toBe(batches);
    });
  });

  describe("getBatch", () => {
    describe("when batch exists", () => {
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValue(batch);
      });

      it("queries and returns batches by specified batch number", async () => {
        const result = await controller.getBatch(10);

        expect(serviceMock.findOne).toHaveBeenCalledTimes(1);
        expect(serviceMock.findOne).toHaveBeenCalledWith(10);
        expect(result).toBe(batch);
      });
    });

    describe("when batch does not exist", () => {
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValueOnce(null);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getBatch(10);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });
});
