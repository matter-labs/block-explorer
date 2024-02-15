import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { TransactionService } from "../../transaction/transaction.service";
import { TransactionReceiptService } from "../../transaction/transactionReceipt.service";
import { TransactionStatus } from "../../transaction/entities/transaction.entity";
import { TransactionDetails } from "../../transaction/entities/transactionDetails.entity";
import { TransactionReceipt } from "../../transaction/entities/transactionReceipt.entity";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { TransactionController } from "./transaction.controller";

const transactionHash = "0x04a4757cd59681b037c1e7bd2402cc45a23c66ed7497614879376719d34e020a";

describe("TransactionController", () => {
  let controller: TransactionController;
  let transactionServiceMock: TransactionService;
  let transactionReceiptServiceMock: TransactionReceiptService;

  beforeEach(async () => {
    transactionServiceMock = mock<TransactionService>({
      findOne: jest.fn().mockResolvedValue(null),
    });
    transactionReceiptServiceMock = mock<TransactionReceiptService>({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const module = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: transactionServiceMock,
        },
        {
          provide: TransactionReceiptService,
          useValue: transactionReceiptServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    controller = module.get<TransactionController>(TransactionController);
  });

  describe("getTransactionStatus", () => {
    it("returns isError as 0 when transaction is not found", async () => {
      const response = await controller.getTransactionStatus(transactionHash);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          isError: "0",
          errDescription: "",
        },
      });
    });

    it("returns isError as 0 when transaction is successful", async () => {
      jest
        .spyOn(transactionServiceMock, "findOne")
        .mockResolvedValue({ status: TransactionStatus.Included } as TransactionDetails);

      const response = await controller.getTransactionStatus(transactionHash);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          isError: "0",
          errDescription: "",
        },
      });
    });

    it("returns isError as 1 when transaction is failed", async () => {
      jest
        .spyOn(transactionServiceMock, "findOne")
        .mockResolvedValue({ status: TransactionStatus.Failed } as TransactionDetails);

      const response = await controller.getTransactionStatus(transactionHash);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          isError: "1",
          errDescription: "",
        },
      });
    });

    it("returns transaction error in errDescription when transaction is failed and transaction error is present", async () => {
      jest.spyOn(transactionServiceMock, "findOne").mockResolvedValue({
        status: TransactionStatus.Failed,
        error: "Error",
        revertReason: "Reverted",
      } as TransactionDetails);

      const response = await controller.getTransactionStatus(transactionHash);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          isError: "1",
          errDescription: "Error",
        },
      });
    });

    it("returns transaction revert reason in errDescription when transaction is failed and transaction revert reason is present", async () => {
      jest
        .spyOn(transactionServiceMock, "findOne")
        .mockResolvedValue({ status: TransactionStatus.Failed, revertReason: "Reverted" } as TransactionDetails);

      const response = await controller.getTransactionStatus(transactionHash);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          isError: "1",
          errDescription: "Reverted",
        },
      });
    });

    it("returns empty errDescription when transaction is failed and transaction error and revert reason are not present", async () => {
      jest
        .spyOn(transactionServiceMock, "findOne")
        .mockResolvedValue({ status: TransactionStatus.Failed } as TransactionDetails);

      const response = await controller.getTransactionStatus(transactionHash);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          isError: "1",
          errDescription: "",
        },
      });
    });
  });

  describe("getTransactionReceiptStatus", () => {
    it("returns status as empty string when transaction receipt is not found", async () => {
      const response = await controller.getTransactionReceiptStatus(transactionHash);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          status: "",
        },
      });
    });

    it("returns transaction receipt status when transaction receipt is found", async () => {
      jest.spyOn(transactionReceiptServiceMock, "findOne").mockResolvedValue({ status: 1 } as TransactionReceipt);

      const response = await controller.getTransactionReceiptStatus(transactionHash);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          status: "1",
        },
      });
    });
  });
});
