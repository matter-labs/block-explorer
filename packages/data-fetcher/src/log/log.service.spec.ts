import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { Block, TransactionReceipt, Log } from "ethers";
import { LogService } from "./log.service";
import { TransferService } from "../transfer/transfer.service";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { BalanceService } from "../balance/balance.service";

describe("LogService", () => {
  let logService: LogService;
  let balanceServiceMock: BalanceService;
  let transferServiceMock: TransferService;
  let transactionReceipt: TransactionReceipt;

  beforeEach(async () => {
    balanceServiceMock = mock<BalanceService>();
    transferServiceMock = mock<TransferService>();
    transactionReceipt = mock<TransactionReceipt>();

    const app = await Test.createTestingModule({
      providers: [
        LogService,
        {
          provide: BalanceService,
          useValue: balanceServiceMock,
        },
        {
          provide: TransferService,
          useValue: transferServiceMock,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    logService = app.get<LogService>(LogService);
  });

  describe("getData", () => {
    const blockDetails = {
      number: 1,
      timestamp: new Date().getTime() / 1000,
    } as Block;

    const transfers = [
      { from: "from1", to: "to1", logIndex: 0 } as Transfer,
      { from: "from2", to: "to2", logIndex: 1 } as Transfer,
    ];

    const ethTransfers = [
      { from: "from3", to: "to1", logIndex: 0 } as Transfer,
      { from: "from4", to: "to2", logIndex: 1 } as Transfer,
    ];

    const logs: Log[] = [{ index: 0 } as Log, { index: 1 } as Log];
    beforeEach(() => {
      jest.spyOn(transferServiceMock, "getTransfers").mockResolvedValueOnce(transfers);
    });

    it("tracks changed balances", async () => {
      await logService.getData(logs, blockDetails);
      expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledTimes(1);
      expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledWith(transfers);
    });

    it("returns data with transaction transfers", async () => {
      const logsData = await logService.getData(logs, blockDetails, ethTransfers, transactionReceipt);
      expect(transferServiceMock.getTransfers).toHaveBeenCalledTimes(1);
      expect(transferServiceMock.getTransfers).toHaveBeenCalledWith(
        logs,
        blockDetails,
        ethTransfers,
        transactionReceipt
      );
      expect(logsData.transfers).toEqual(transfers);
    });
  });
});
