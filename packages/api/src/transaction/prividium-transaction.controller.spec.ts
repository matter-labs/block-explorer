import { PrividiumTransactionController } from "./prividium-transaction.controller";
import { mock, MockProxy } from "jest-mock-extended";
import { TransactionService } from "./transaction.service";
import { TransferService } from "../transfer/transfer.service";
import { LogService } from "../log/log.service";
import { TransactionController } from "./transaction.controller";
import { Request } from "express";
import { calculateSiwe } from "../../test/utils/siwe-message-tools";

describe("PrividiumTransactionController", () => {
  let transactionService: MockProxy<TransactionService>;
  let transferService: MockProxy<TransferService>;
  let logService: MockProxy<LogService>;

  let req: Request;

  beforeEach(async () => {
    transactionService = mock<TransactionService>();
    transferService = mock<TransferService>();
    logService = mock<LogService>();

    req = mock<Request>();
  });

  it("delegates getTransaction to provided impl", async () => {
    const implMock = mock<TransactionController>();
    const Klass = jest.fn();
    Klass.mockImplementation(function () {
      return implMock;
    });

    const controller = new PrividiumTransactionController(transactionService, transferService, logService, Klass);

    const txId = "0x01";
    await controller.getTransaction(txId);
    expect(implMock.getTransaction).toHaveBeenCalledTimes(1);
    expect(implMock.getTransaction).toHaveBeenCalledWith(txId);
  });

  it("delegates getTransactionTransfers to provided impl", async () => {
    const implMock = mock<TransactionController>();
    const Klass = jest.fn();
    Klass.mockImplementation(function () {
      return implMock;
    });

    const controller = new PrividiumTransactionController(transactionService, transferService, logService, Klass);

    const txId = "0x01";
    const pagingOptions = { maxLimit: 10, page: 1, limit: 30 };
    await controller.getTransactionTransfers(txId, pagingOptions);
    expect(implMock.getTransactionTransfers).toHaveBeenCalledTimes(1);
    expect(implMock.getTransactionTransfers).toHaveBeenCalledWith(txId, pagingOptions);
  });

  it("delegates getTransactionLogs to provided impl", async () => {
    const implMock = mock<TransactionController>();
    const Klass = jest.fn();
    Klass.mockImplementation(function () {
      return implMock;
    });

    const controller = new PrividiumTransactionController(transactionService, transferService, logService, Klass);

    const txId = "0x01";
    const pagingOptions = { maxLimit: 10, page: 1, limit: 30 };
    await controller.getTransactionLogs(txId, pagingOptions);
    expect(implMock.getTransactionLogs).toHaveBeenCalledTimes(1);
    expect(implMock.getTransactionLogs).toHaveBeenCalledWith(txId, pagingOptions);
  });

  it("applies correct filters to when listing transactions", async () => {
    const Klass = jest.fn();
    const controller = new PrividiumTransactionController(transactionService, transferService, logService, Klass);

    const nonce = "8r2cXq20yD3l5bomR";
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const { siwe } = await calculateSiwe({
      nonce,
      privateKey,
      chainId: 333,
    });

    req.session.siwe = siwe;
    await controller.getTransactions(
      {
        address: "0x01",
      },
      {
        toDate: new Date().toDateString(),
        fromDate: new Date().toDateString(),
      },
      {
        page: 1,
        limit: 10,
        maxLimit: 30,
      },
      req
    );

    expect(transactionService.findAll).toHaveBeenCalledTimes(1);
    expect(transactionService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        address: siwe.address,
        filterAddressInLogTopics: true,
      }),
      expect.anything()
    );
  });
});
