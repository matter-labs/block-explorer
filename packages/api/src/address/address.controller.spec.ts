import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Pagination } from "nestjs-typeorm-paginate";
import { AddressController } from "./address.controller";
import { AddressService } from "./address.service";
import { BalanceService } from "../balance/balance.service";
import { BlockService } from "../block/block.service";
import { LogService } from "../log/log.service";
import { TransactionService } from "../transaction/transaction.service";
import { Log } from "../log/log.entity";
import { Token } from "../token/token.entity";
import { PagingOptionsWithMaxItemsLimitDto } from "../common/dtos";
import { AddressType } from "./dtos/baseAddress.dto";
import { TransferService } from "../transfer/transfer.service";
import { Transfer, TransferType } from "../transfer/transfer.entity";

jest.mock("../common/utils", () => ({
  ...jest.requireActual("../common/utils"),
  buildDateFilter: jest.fn().mockReturnValue({ timestamp: "timestamp" }),
}));

describe("AddressController", () => {
  let controller: AddressController;
  let serviceMock: AddressService;
  let blockServiceMock: BlockService;
  let logServiceMock: LogService;
  let balanceServiceMock: BalanceService;
  let transactionServiceMock: TransactionService;
  let transferServiceMock: TransferService;
  const blockchainAddress = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
  const normalizedAddress = "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF";
  const pagingOptions: PagingOptionsWithMaxItemsLimitDto = { limit: 10, page: 2, maxLimit: 10000 };

  beforeEach(async () => {
    serviceMock = mock<AddressService>();
    blockServiceMock = mock<BlockService>();
    transactionServiceMock = mock<TransactionService>();
    logServiceMock = mock<LogService>();
    balanceServiceMock = mock<BalanceService>();
    transferServiceMock = mock<TransferService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressController],
      providers: [
        {
          provide: AddressService,
          useValue: serviceMock,
        },
        {
          provide: BlockService,
          useValue: blockServiceMock,
        },
        {
          provide: TransactionService,
          useValue: transactionServiceMock,
        },
        {
          provide: LogService,
          useValue: logServiceMock,
        },
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

    controller = module.get<AddressController>(AddressController);
  });

  describe("getAddress", () => {
    let addressRecord;

    beforeEach(() => {
      (balanceServiceMock.getBalances as jest.Mock).mockResolvedValue({
        blockNumber: 0,
        balances: {},
      });
    });

    it("queries addresses by specified address", async () => {
      await controller.getAddress(blockchainAddress);
      expect(serviceMock.findFullAddress).toHaveBeenCalledTimes(1);
      expect(serviceMock.findFullAddress).toHaveBeenCalledWith(blockchainAddress, true);
    });
  });

  describe("getAddressLogs", () => {
    const transactionLogs = mock<Pagination<Log>>();
    const address = "address";
    describe("when address exists", () => {
      beforeEach(() => {
        (logServiceMock.findAll as jest.Mock).mockResolvedValueOnce(transactionLogs);
      });

      it("queries addresses with the specified options", async () => {
        await controller.getAddressLogs(address, pagingOptions);
        expect(logServiceMock.findAll).toHaveBeenCalledTimes(1);
        expect(logServiceMock.findAll).toHaveBeenCalledWith(
          { address },
          {
            ...pagingOptions,
            route: `address/${address}/logs`,
          }
        );
      });

      it("returns address logs", async () => {
        const result = await controller.getAddressLogs(address, pagingOptions);
        expect(result).toBe(transactionLogs);
      });
    });
  });

  describe("getAddressTransfers", () => {
    const transfers = mock<Pagination<Transfer>>();
    const address = "address";
    const listFilterOptions = {
      fromDate: "2023-02-08T15:34:46.251Z",
      toDate: "2023-02-08T17:34:46.251Z",
    };
    const pagingOptions: PagingOptionsWithMaxItemsLimitDto = { limit: 10, page: 2, maxLimit: 10000 };

    beforeEach(() => {
      (transferServiceMock.findAll as jest.Mock).mockResolvedValueOnce(transfers);
    });

    it("queries transfers with the specified options when no filters provided", async () => {
      await controller.getAddressTransfers(address, {}, listFilterOptions, pagingOptions);
      expect(transferServiceMock.findAll).toHaveBeenCalledTimes(1);
      expect(transferServiceMock.findAll).toHaveBeenCalledWith(
        {
          address,
          isFeeOrRefund: false,
          timestamp: "timestamp",
        },
        {
          filterOptions: listFilterOptions,
          ...pagingOptions,
          route: `address/${address}/transfers`,
        }
      );
    });

    it("queries transfers with the specified options when filters are provided", async () => {
      await controller.getAddressTransfers(address, { type: TransferType.Transfer }, listFilterOptions, pagingOptions);
      expect(transferServiceMock.findAll).toHaveBeenCalledTimes(1);
      expect(transferServiceMock.findAll).toHaveBeenCalledWith(
        {
          address,
          type: TransferType.Transfer,
          timestamp: "timestamp",
        },
        {
          filterOptions: { type: TransferType.Transfer, ...listFilterOptions },
          ...pagingOptions,
          route: `address/${address}/transfers`,
        }
      );
    });

    it("returns the transfers", async () => {
      const result = await controller.getAddressTransfers(address, {}, listFilterOptions, pagingOptions);
      expect(result).toBe(transfers);
    });
  });
});
