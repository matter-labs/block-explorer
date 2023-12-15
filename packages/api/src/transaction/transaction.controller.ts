import { Controller, Get, Param, NotFoundException, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiExcludeController,
} from "@nestjs/swagger";
import { Pagination } from "nestjs-typeorm-paginate";
import { ApiListPageOkResponse } from "../common/decorators/apiListPageOkResponse";
import { PagingOptionsWithMaxItemsLimitDto, ListFiltersDto } from "../common/dtos";
import { buildDateFilter } from "../common/utils";
import { FilterTransactionsOptionsDto } from "./dtos/filterTransactionsOptions.dto";
import { TransferDto } from "../transfer/transfer.dto";
import { TransactionDto } from "./dtos/transaction.dto";
import { TransactionDetailsDto } from "./dtos/transactionDetails.dto";
import { TransferService } from "../transfer/transfer.service";
import { LogDto } from "../log/log.dto";
import { LogService } from "../log/log.service";
import { TransactionService } from "./transaction.service";
import { ParseTransactionHashPipe, TX_HASH_REGEX_PATTERN } from "../common/pipes/parseTransactionHash.pipe";
import { swagger } from "../config/featureFlags";
import { constants } from "../config/docs";

const entityName = "transactions";

@ApiTags("Transaction BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly transferService: TransferService,
    private readonly logService: LogService
  ) {}

  @Get("")
  @ApiListPageOkResponse(TransactionDto, { description: "Successfully returned transactions list" })
  @ApiBadRequestResponse({ description: "Query params are not valid or out of range" })
  public async getTransactions(
    @Query() filterTransactionsOptions: FilterTransactionsOptionsDto,
    @Query() listFilterOptions: ListFiltersDto,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<Pagination<TransactionDto>> {
    const filterTransactionsListOptions = buildDateFilter(
      listFilterOptions.fromDate,
      listFilterOptions.toDate,
      "receivedAt"
    );
    return await this.transactionService.findAll(
      {
        ...filterTransactionsOptions,
        ...filterTransactionsListOptions,
      },
      {
        filterOptions: { ...filterTransactionsOptions, ...listFilterOptions },
        ...pagingOptions,
        route: entityName,
      }
    );
  }

  @Get(":transactionHash")
  @ApiParam({
    name: "transactionHash",
    schema: { pattern: TX_HASH_REGEX_PATTERN },
    example: constants.txHash,
    description: "Valid transaction hash",
  })
  @ApiOkResponse({ description: "Transaction was returned successfully", type: TransactionDto })
  @ApiBadRequestResponse({ description: "Transaction hash is invalid" })
  @ApiNotFoundResponse({ description: "Transaction with the specified hash does not exist" })
  public async getTransaction(
    @Param("transactionHash", new ParseTransactionHashPipe()) transactionHash: string
  ): Promise<TransactionDetailsDto> {
    const transactionDetail = await this.transactionService.findOne(transactionHash);
    if (!transactionDetail) {
      throw new NotFoundException();
    }
    return transactionDetail;
  }

  @Get(":transactionHash/transfers")
  @ApiParam({
    name: "transactionHash",
    schema: { pattern: TX_HASH_REGEX_PATTERN },
    example: constants.txHash,
    description: "Valid transaction hash",
  })
  @ApiListPageOkResponse(TransferDto, { description: "Successfully returned transaction transfers list" })
  @ApiBadRequestResponse({
    description: "Transaction hash is invalid or paging query params are not valid or out of range",
  })
  @ApiNotFoundResponse({ description: "Transaction with the specified hash does not exist" })
  public async getTransactionTransfers(
    @Param("transactionHash", new ParseTransactionHashPipe()) transactionHash: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<Pagination<TransferDto>> {
    if (!(await this.transactionService.exists(transactionHash))) {
      throw new NotFoundException();
    }

    return await this.transferService.findAll(
      { transactionHash },
      {
        ...pagingOptions,
        route: `${entityName}/${transactionHash}/transfers`,
      }
    );
  }

  @Get(":transactionHash/logs")
  @ApiParam({
    name: "transactionHash",
    schema: { pattern: TX_HASH_REGEX_PATTERN },
    example: constants.txHash,
    description: "Valid transaction hash",
  })
  @ApiListPageOkResponse(LogDto, { description: "Successfully returned transaction logs list" })
  @ApiBadRequestResponse({
    description: "Transaction hash is invalid or paging query params are not valid or out of range",
  })
  @ApiNotFoundResponse({ description: "Transaction with the specified hash does not exist" })
  public async getTransactionLogs(
    @Param("transactionHash", new ParseTransactionHashPipe()) transactionHash: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<Pagination<LogDto>> {
    if (!(await this.transactionService.exists(transactionHash))) {
      throw new NotFoundException();
    }

    return await this.logService.findAll(
      { transactionHash },
      {
        ...pagingOptions,
        route: `${entityName}/${transactionHash}/logs`,
      }
    );
  }
}
