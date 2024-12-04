import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { types } from "zksync-ethers";
import { LogService } from "./log.service";
import { TransferService } from "../transfer/transfer.service";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { TokenService, Token } from "../token/token.service";
import { AddressService } from "../address/address.service";
import { BalanceService } from "../balance/balance.service";
import { ContractAddress } from "../address/interface/contractAddress.interface";

describe("LogService", () => {
  let logService: LogService;
  let addressServiceMock: AddressService;
  let balanceServiceMock: BalanceService;
  let transferServiceMock: TransferService;
  let tokenServiceMock: TokenService;

  beforeEach(async () => {
    addressServiceMock = mock<AddressService>();
    balanceServiceMock = mock<BalanceService>();
    transferServiceMock = mock<TransferService>();
    tokenServiceMock = mock<TokenService>();

    const app = await Test.createTestingModule({
      providers: [
        LogService,
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

    const deployedContractAddresses = [
      mock<ContractAddress>({ address: "0xdc187378edD8Ed1585fb47549Cc5fe633295d571" }),
      mock<ContractAddress>({ address: "0xD144ca8Aa2E7DFECD56a3CCcBa1cd873c8e5db58" }),
    ];

    const transfers = [
      { from: "from1", to: "to1", logIndex: 0 } as Transfer,
      { from: "from2", to: "to2", logIndex: 1 } as Transfer,
    ];
    const logs: types.Log[] = [{ index: 0 } as types.Log, { index: 1 } as types.Log];
    const tokens: Token[] = [
      {
        l1Address: "l1Address1",
      } as Token,
      {
        l1Address: "l1Address2",
      } as Token,
    ];

    let transactionReceipt: types.TransactionReceipt;
    let transactionDetails: types.TransactionDetails;

    beforeEach(() => {
      jest.spyOn(addressServiceMock, "getContractAddresses").mockResolvedValueOnce(deployedContractAddresses);
      jest.spyOn(transferServiceMock, "getTransfers").mockReturnValueOnce(transfers);
      jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValueOnce(tokens[0]);
      jest.spyOn(tokenServiceMock, "getERC20Token").mockResolvedValueOnce(tokens[1]);

      transactionReceipt = mock<types.TransactionReceipt>();
      transactionDetails = mock<types.TransactionDetails>({
        receivedAt: new Date(),
      });
    });

    describe("when transaction details and receipt are defined", () => {
      beforeEach(() => {
        transactionReceipt = mock<types.TransactionReceipt>({
          index: 0,
          logs: logs,
        });
      });

      it("returns data with transaction transfers", async () => {
        const logsData = await logService.getData(logs, blockDetails, transactionDetails, transactionReceipt);
        expect(transferServiceMock.getTransfers).toHaveBeenCalledTimes(1);
        expect(transferServiceMock.getTransfers).toHaveBeenCalledWith(
          logs,
          blockDetails,
          transactionDetails,
          transactionReceipt
        );
        expect(logsData.transfers).toEqual(transfers);
      });

      it("tracks changed balances", async () => {
        await logService.getData(logs, blockDetails, transactionDetails, transactionReceipt);
        expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledTimes(1);
        expect(balanceServiceMock.trackChangedBalances).toHaveBeenCalledWith(transfers);
      });

      it("returns data with deployed contracts' addresses", async () => {
        const logsData = await logService.getData(logs, blockDetails, transactionDetails, transactionReceipt);
        expect(addressServiceMock.getContractAddresses).toHaveBeenCalledTimes(1);
        expect(addressServiceMock.getContractAddresses).toHaveBeenCalledWith(logs, transactionReceipt);
        expect(logsData.contractAddresses).toEqual(deployedContractAddresses);
      });

      it("returns data with ERC20 tokens", async () => {
        const logsData = await logService.getData(logs, blockDetails, transactionDetails, transactionReceipt);
        expect(tokenServiceMock.getERC20Token).toHaveBeenCalledTimes(2);
        expect(tokenServiceMock.getERC20Token).toHaveBeenCalledWith(deployedContractAddresses[0], transactionReceipt);
        expect(tokenServiceMock.getERC20Token).toHaveBeenCalledWith(deployedContractAddresses[1], transactionReceipt);
        expect(logsData.tokens).toEqual(tokens);
      });
    });

    describe("when transaction details and receipt are not defined", () => {
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
});
