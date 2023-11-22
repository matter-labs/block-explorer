import { Controller, Get, Query, Logger, UseFilters, ParseArrayPipe, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { L2_ETH_TOKEN_ADDRESS } from "../../common/constants";
import { TokenType } from "../../token/token.entity";
import { dateToTimestamp } from "../../common/utils";
import { BlockService } from "../../block/block.service";
import { TransactionService } from "../../transaction/transaction.service";
import { TransferService } from "../../transfer/transfer.service";
import { BalanceService } from "../../balance/balance.service";
import { PagingOptionsWithMaxItemsLimitDto } from "../dtos/common/pagingOptionsWithMaxItemsLimit.dto";
import { SortingOptionsDto } from "../dtos/common/sortingOptions.dto";
import { ParseLimitedIntPipe } from "../../common/pipes/parseLimitedInt.pipe";
import { ParseAddressPipe } from "../../common/pipes/parseAddress.pipe";
import { ParseTransactionHashPipe } from "../../common/pipes/parseTransactionHash.pipe";
import { mapTransactionListItem } from "../mappers/transactionMapper";
import { mapInternalTransactionListItem } from "../mappers/internalTransactionMapper";
import { mapTransferListItem } from "../mappers/transferMapper";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { AccountTransactionsResponseDto } from "../dtos/account/accountTransactionsResponse.dto";
import { AccountInternalTransactionsResponseDto } from "../dtos/account/accountInternalTransactionsResponse.dto";
import {
  AccountTokenTransfersResponseDto,
  AccountNFTTransfersResponseDto,
} from "../dtos/account/accountTokenTransfersResponse.dto";
import {
  AccountEtherBalanceResponseDto,
  AccountsEtherBalancesResponseDto,
} from "../dtos/account/accountEtherBalanceResponse.dto";
import { AccountMinedBlocksResponseDto } from "../dtos/account/accountMinedBlocksResponse.dto";
import { ApiExceptionFilter } from "../exceptionFilter";

const entityName = "account";

export const parseAddressListPipeExceptionFactory = () => new BadRequestException("Error! Missing address");

@ApiExcludeController()
@ApiTags(entityName)
@Controller(`api/${entityName}`)
@UseFilters(ApiExceptionFilter)
export class AccountController {
  private readonly logger: Logger;

  constructor(
    private readonly blockService: BlockService,
    private readonly transactionService: TransactionService,
    private readonly transferService: TransferService,
    private readonly balanceService: BalanceService
  ) {
    this.logger = new Logger(AccountController.name);
  }

  @Get("/txlist")
  public async getAccountTransactions(
    @Query("address", new ParseAddressPipe()) address: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Query() sortingOptions: SortingOptionsDto,
    @Query("startblock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) startBlock?: number,
    @Query("endblock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) endBlock?: number
  ): Promise<AccountTransactionsResponseDto> {
    const [lastBlockNumber, transactions] = await Promise.all([
      this.blockService.getLastBlockNumber(),
      this.transactionService.findByAddress(address, {
        startBlock,
        endBlock,
        ...pagingOptions,
        ...sortingOptions,
      }),
    ]);
    const transactionsList = transactions.map((transaction) => mapTransactionListItem(transaction, lastBlockNumber));
    return {
      status: transactionsList.length ? ResponseStatus.OK : ResponseStatus.NOTOK,
      message: transactionsList.length ? ResponseMessage.OK : ResponseMessage.NO_TRANSACTIONS_FOUND,
      result: transactionsList,
    };
  }

  @Get("/txlistinternal")
  public async getAccountInternalTransactions(
    @Query("address", new ParseAddressPipe({ required: false, errorMessage: "Error! Invalid address format" }))
    address: string,
    @Query(
      "txhash",
      new ParseTransactionHashPipe({ required: false, errorMessage: "Error! Invalid transaction hash format" })
    )
    transactionHash: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Query() sortingOptions: SortingOptionsDto,
    @Query("startblock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) startBlock?: number,
    @Query("endblock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) endBlock?: number
  ): Promise<AccountInternalTransactionsResponseDto> {
    const transfers = await this.transferService.findInternalTransfers({
      address,
      transactionHash,
      startBlock,
      endBlock,
      ...pagingOptions,
      ...sortingOptions,
    });
    const internalTransactionsList = transfers.map((transfer) => mapInternalTransactionListItem(transfer));
    return {
      status: internalTransactionsList.length ? ResponseStatus.OK : ResponseStatus.NOTOK,
      message: internalTransactionsList.length ? ResponseMessage.OK : ResponseMessage.NO_TRANSACTIONS_FOUND,
      result: internalTransactionsList,
    };
  }

  @Get("/tokentx")
  public async getAccountTokenTransfers(
    @Query("address", new ParseAddressPipe({ required: false, errorMessage: "Error! Invalid address format" }))
    address: string,
    @Query(
      "contractaddress",
      new ParseAddressPipe({ required: false, errorMessage: "Error! Invalid contract address format" })
    )
    contractAddress: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Query() sortingOptions: SortingOptionsDto,
    @Query("startblock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) startBlock?: number,
    @Query("endblock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) endBlock?: number
  ): Promise<AccountTokenTransfersResponseDto> {
    const [lastBlockNumber, transfers] = await Promise.all([
      this.blockService.getLastBlockNumber(),
      this.transferService.findTokenTransfers({
        tokenType: TokenType.ERC20,
        address,
        tokenAddress: contractAddress,
        startBlock,
        endBlock,
        ...pagingOptions,
        ...sortingOptions,
      }),
    ]);
    const transfersList = transfers.map((transfer) => mapTransferListItem(transfer, lastBlockNumber));
    return {
      status: transfersList.length ? ResponseStatus.OK : ResponseStatus.NOTOK,
      message: transfersList.length ? ResponseMessage.OK : ResponseMessage.NO_TRANSACTIONS_FOUND,
      result: transfersList,
    };
  }

  @Get("/tokennfttx")
  public async getAccountNFTTransfers(
    @Query("address", new ParseAddressPipe({ required: false, errorMessage: "Error! Invalid address format" }))
    address: string,
    @Query(
      "contractaddress",
      new ParseAddressPipe({ required: false, errorMessage: "Error! Invalid contract address format" })
    )
    contractAddress: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Query() sortingOptions: SortingOptionsDto,
    @Query("startblock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) startBlock?: number,
    @Query("endblock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) endBlock?: number
  ): Promise<AccountNFTTransfersResponseDto> {
    const [lastBlockNumber, transfers] = await Promise.all([
      this.blockService.getLastBlockNumber(),
      this.transferService.findTokenTransfers({
        tokenType: TokenType.ERC721,
        address,
        tokenAddress: contractAddress,
        startBlock,
        endBlock,
        ...pagingOptions,
        ...sortingOptions,
      }),
    ]);
    const transfersList = transfers.map((transfer) => mapTransferListItem(transfer, lastBlockNumber));
    return {
      status: transfersList.length ? ResponseStatus.OK : ResponseStatus.NOTOK,
      message: transfersList.length ? ResponseMessage.OK : ResponseMessage.NO_TRANSACTIONS_FOUND,
      result: transfersList,
    };
  }

  @Get("/balance")
  public async getAccountEtherBalance(
    @Query("address", new ParseAddressPipe()) address: string
  ): Promise<AccountEtherBalanceResponseDto> {
    const balance = await this.balanceService.getBalance(address, L2_ETH_TOKEN_ADDRESS);
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: balance,
    };
  }

  @Get("/balancemulti")
  public async getAccountsEtherBalances(
    @Query(
      "address",
      new ParseArrayPipe({
        items: String,
        separator: ",",
        exceptionFactory: parseAddressListPipeExceptionFactory,
      }),
      new ParseAddressPipe({ required: true, each: true, errorMessage: "Error! Invalid address format" })
    )
    addresses: string[]
  ): Promise<AccountsEtherBalancesResponseDto> {
    const uniqueAddresses = [...new Set(addresses)];
    if (uniqueAddresses.length > 20) {
      throw new BadRequestException("Maximum 20 addresses per request");
    }
    const balances = await this.balanceService.getBalancesByAddresses(addresses, L2_ETH_TOKEN_ADDRESS);
    const result = addresses.map((address) => ({
      account: address,
      balance: balances.find((balance) => balance.address.toLowerCase() === address.toLowerCase())?.balance || "0",
    }));

    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result,
    };
  }

  @Get("/tokenbalance")
  public async getAccountTokenBalance(
    @Query("address", new ParseAddressPipe()) address: string,
    @Query("contractaddress", new ParseAddressPipe({ errorMessage: "Invalid contractAddress format" }))
    contractAddress: string
  ): Promise<AccountEtherBalanceResponseDto> {
    const balance = await this.balanceService.getBalance(address, contractAddress);
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: balance,
    };
  }

  @Get("/getminedblocks")
  public async getAccountMinedBlocks(
    @Query("address", new ParseAddressPipe()) address: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<AccountMinedBlocksResponseDto> {
    const blocks = await this.blockService.findMany({
      miner: address,
      ...pagingOptions,
      selectFields: ["number", "timestamp"],
    });
    if (!blocks.length) {
      return {
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NO_TRANSACTIONS_FOUND,
        result: [],
      };
    }
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: blocks.map((block) => ({
        blockNumber: block.number.toString(),
        timeStamp: dateToTimestamp(block.timestamp).toString(),
        blockReward: "0",
      })),
    };
  }
}
