import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { types } from "zksync-ethers";
import { LogService } from "./log.service";
import { TransferService } from "../transfer/transfer.service";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { BalanceService } from "../balance/balance.service";

describe("LogService", () => {
  let logService: LogService;
  let balanceServiceMock: BalanceService;
  let transferServiceMock: TransferService;

  beforeEach(async () => {
    balanceServiceMock = mock<BalanceService>();
    transferServiceMock = mock<TransferService>();

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
    } as types.BlockDetails;

    const transfers = [
      { from: "from1", to: "to1", logIndex: 0 } as Transfer,
      { from: "from2", to: "to2", logIndex: 1 } as Transfer,
    ];
    const logs: types.Log[] = [{ index: 0 } as types.Log, { index: 1 } as types.Log];
    beforeEach(() => {
      jest.spyOn(transferServiceMock, "getTransfers").mockResolvedValueOnce(transfers);
    });

    it("tracks changed balances", async () => {
      await logService.getData(logs, blockDetails);
      expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledTimes(1);
      expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledWith(transfers);
    });

    it("returns data with transaction transfers", async () => {
      const logsData = await logService.getData(logs, blockDetails);
      expect(transferServiceMock.getTransfers).toHaveBeenCalledTimes(1);
      expect(transferServiceMock.getTransfers).toHaveBeenCalledWith(logs, blockDetails, undefined, undefined);
      expect(logsData.transfers).toEqual(transfers);
    });
  });
});
