import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { types } from "zksync-web3";
import { LogRepository } from "../repositories";
import { Log } from "../entities";
import { LogProcessor } from "./log.processor";
import { TransferService } from "../transfer/transfer.service";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { TokenService } from "../token/token.service";
import { AddressService } from "../address/address.service";
import { BalanceService } from "../balance/balance.service";
import { ContractAddress } from "../address/interface/contractAddress.interface";

describe("LogProcessor", () => {
  let logProcessor: LogProcessor;
  let addressServiceMock: AddressService;
  let balanceServiceMock: BalanceService;
  let transferServiceMock: TransferService;
  let tokenServiceMock: TokenService;
  let logRepositoryMock: LogRepository;

  beforeEach(async () => {
    addressServiceMock = mock<AddressService>();
    balanceServiceMock = mock<BalanceService>();
    transferServiceMock = mock<TransferService>();
    tokenServiceMock = mock<TokenService>();
    logRepositoryMock = mock<LogRepository>();

    const app = await Test.createTestingModule({
      providers: [
        LogProcessor,
        {
          provide: AddressService,
          useValue: addressServiceMock,
        },
        {
          provide: BalanceService,
          useValue: balanceServiceMock,
        },
        {
          provide: TransferService,
          useValue: transferServiceMock,
        },
        {
          provide: TokenService,
          useValue: tokenServiceMock,
        },
        {
          provide: LogRepository,
          useValue: logRepositoryMock,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    logProcessor = app.get<LogProcessor>(LogProcessor);
  });

  describe("process", () => {
    const blockDetails = {
      number: 1,
      timestamp: new Date().getTime() / 1000,
    } as types.BlockDetails;

    const deployedContractAddresses = [
      mock<ContractAddress>({ address: "0xdc187378edD8Ed1585fb47549Cc5fe633295d571" }),
      mock<ContractAddress>({ address: "0xD144ca8Aa2E7DFECD56a3CCcBa1cd873c8e5db58" }),
    ];

    const logs: types.Log[] = [mock<types.Log>(), mock<types.Log>()];
    let logsWithTransactionTimestamp: Partial<Log>[];
    let logsWithBlockTimestamp: Partial<Log>[];
    let transactionReceipt: types.TransactionReceipt;
    let transactionDetails: types.TransactionDetails;

    beforeEach(() => {
      jest.spyOn(addressServiceMock, "saveContractAddresses").mockResolvedValueOnce(deployedContractAddresses);
      transactionReceipt = mock<types.TransactionReceipt>();
      transactionDetails = mock<types.TransactionDetails>({
        receivedAt: new Date(),
      });
      logsWithTransactionTimestamp = logs.map((log) => ({ ...log, timestamp: transactionDetails.receivedAt }));
      logsWithBlockTimestamp = logs.map((log) => ({ ...log, timestamp: new Date(blockDetails.timestamp * 1000) }));
    });

    describe("when transaction details and receipt are defined", () => {
      beforeEach(() => {
        transactionReceipt = mock<types.TransactionReceipt>({
          transactionIndex: 0,
          logs: logs,
        });
      });

      it("adds the logs", async () => {
        await logProcessor.process(logs, blockDetails, transactionDetails, transactionReceipt);
        expect(logRepositoryMock.addMany).toHaveBeenCalledTimes(1);
        expect(logRepositoryMock.addMany).toHaveBeenCalledWith(logsWithTransactionTimestamp);
      });

      it("saves transaction transfers", async () => {
        await logProcessor.process(logs, blockDetails, transactionDetails, transactionReceipt);
        expect(transferServiceMock.saveTransfers).toHaveBeenCalledTimes(1);
        expect(transferServiceMock.saveTransfers).toHaveBeenCalledWith(
          logs,
          blockDetails,
          transactionDetails,
          transactionReceipt
        );
      });

      it("tracks changed balances", async () => {
        const transfers = [mock<Transfer>(), mock<Transfer>()];
        (transferServiceMock.saveTransfers as jest.Mock).mockResolvedValue(transfers);
        await logProcessor.process(logs, blockDetails, transactionDetails, transactionReceipt);
        expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledTimes(1);
        expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledWith(transfers);
      });

      it("saves deployed contracts' addresses", async () => {
        await logProcessor.process(logs, blockDetails, transactionDetails, transactionReceipt);
        expect(addressServiceMock.saveContractAddresses).toHaveBeenCalledTimes(1);
        expect(addressServiceMock.saveContractAddresses).toHaveBeenCalledWith(logs, transactionReceipt);
      });

      it("saves ERC20 tokens", async () => {
        await logProcessor.process(logs, blockDetails, transactionDetails, transactionReceipt);
        expect(tokenServiceMock.saveERC20Token).toHaveBeenCalledTimes(2);
        expect(tokenServiceMock.saveERC20Token).toHaveBeenCalledWith(deployedContractAddresses[0], transactionReceipt);
        expect(tokenServiceMock.saveERC20Token).toHaveBeenCalledWith(deployedContractAddresses[1], transactionReceipt);
      });
    });

    describe("when transaction details and receipt are not defined", () => {
      it("adds the logs", async () => {
        await logProcessor.process(logs, blockDetails);
        expect(logRepositoryMock.addMany).toHaveBeenCalledTimes(1);
        expect(logRepositoryMock.addMany).toHaveBeenCalledWith(logsWithBlockTimestamp);
      });

      it("tracks changed balances", async () => {
        const transfers = [mock<Transfer>(), mock<Transfer>()];
        (transferServiceMock.saveTransfers as jest.Mock).mockResolvedValue(transfers);
        await logProcessor.process(logs, blockDetails);
        expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledTimes(1);
        expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledWith(transfers);
      });

      it("saves transaction transfers", async () => {
        await logProcessor.process(logs, blockDetails);
        expect(transferServiceMock.saveTransfers).toHaveBeenCalledTimes(1);
        expect(transferServiceMock.saveTransfers).toHaveBeenCalledWith(logs, blockDetails, undefined, undefined);
      });
    });
  });
});
