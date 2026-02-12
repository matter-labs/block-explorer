import { Controller, Get, Param, NotFoundException, Query, UseInterceptors } from "@nestjs/common";
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
import { FilterTransactionsOptionsDto } from "./dtos/filterTransactionsOptions.dto";
import { TransferDto } from "../transfer/transfer.dto";
import { TransactionDto } from "./dtos/transaction.dto";
import { TransferService } from "../transfer/transfer.service";
import { LogDto } from "../log/log.dto";
import { LogService } from "../log/log.service";
import { TransactionService } from "./transaction.service";
import { ParseTransactionHashPipe, TX_HASH_REGEX_PATTERN } from "../common/pipes/parseTransactionHash.pipe";
import { swagger } from "../config/featureFlags";
import { constants } from "../config/docs";
import { User } from "../user/user.decorator";
import { AddUserRolesPipe, UserWithRoles } from "../api/pipes/addUserRoles.pipe";
import { Visibility } from "../prividium/visibility/visibility.decorator";
import { VisibilityContext } from "../prividium/visibility/visibility.context";
import { VisibilityInterceptor } from "../prividium/visibility/visibility.interceptor";
import { TransactionFilterBuilder } from "./transaction-filter.builder";

const entityName = "transactions";

@ApiTags("Transaction BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
@UseInterceptors(VisibilityInterceptor)
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly transferService: TransferService,
    private readonly logService: LogService,
    private readonly transactionFilterBuilder: TransactionFilterBuilder
  ) {}

  @Get("")
  @ApiListPageOkResponse(TransactionDto, { description: "Successfully returned transactions list" })
  @ApiBadRequestResponse({ description: "Query params are not valid or out of range" })
  public async getTransactions(
    @Query() filterTransactionsOptions: FilterTransactionsOptionsDto,
    @Query() listFilterOptions: ListFiltersDto,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Visibility() visibility: VisibilityContext
  ): Promise<Pagination<TransactionDto>> {
    const userFilters = this.transactionFilterBuilder.build(filterTransactionsOptions, listFilterOptions, visibility);
    return await this.transactionService.findAll(userFilters, {
      filterOptions: { ...filterTransactionsOptions, ...listFilterOptions },
      ...pagingOptions,
      route: entityName,
    });
  }

  @Get(":transactionHash")
  @ApiParam({
    name: "transactionHash",
    type: String,
    schema: { pattern: TX_HASH_REGEX_PATTERN },
    example: constants.txHash,
    description: "Valid transaction hash",
  })
  @ApiOkResponse({ description: "Transaction was returned successfully", type: TransactionDto })
  @ApiBadRequestResponse({ description: "Transaction hash is invalid" })
  @ApiNotFoundResponse({ description: "Transaction with the specified hash does not exist" })
  public async getTransaction(
    @Param("transactionHash", new ParseTransactionHashPipe()) transactionHash: string,
    @Visibility() visibility: VisibilityContext
  ): Promise<TransactionDto> {
    const transactionDetail = await this.transactionService.findOne(transactionHash);
    if (!transactionDetail) {
      throw new NotFoundException();
    }

    if (!visibility.isAdmin && visibility.userAddress) {
      const transactionLogs = await this.logService.findAll(
        { transactionHash },
        {
          page: 1,
          limit: 10_000, // default max limit used in pagination-enabled endpoints
        }
      );
      if (
        !this.transactionService.isTransactionVisibleByUser(transactionDetail, transactionLogs.items, {
          address: visibility.userAddress,
          isAdmin: visibility.isAdmin,
          token: visibility.token,
        } as UserWithRoles)
      ) {
        throw new NotFoundException();
      }
      return transactionDetail;
    }

    return transactionDetail;
  }

  @Get(":transactionHash/transfers")
  @ApiParam({
    name: "transactionHash",
    type: String,
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
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Visibility() visibility: VisibilityContext
  ): Promise<Pagination<TransferDto>> {
    if (!(await this.transactionService.exists(transactionHash))) {
      throw new NotFoundException();
    }
    const userFilters = !visibility.isAdmin && visibility.userAddress ? { visibleBy: visibility.userAddress } : {};

    const transfers = await this.transferService.findAll(
      { transactionHash, ...userFilters },
      {
        ...pagingOptions,
        route: `${entityName}/${transactionHash}/transfers`,
      }
    );
    return transfers;
  }

  @Get(":transactionHash/logs")
  @ApiParam({
    name: "transactionHash",
    type: String,
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
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Visibility() visibility: VisibilityContext
  ): Promise<Pagination<LogDto>> {
    if (!(await this.transactionService.exists(transactionHash))) {
      throw new NotFoundException();
    }

    return await this.logService.findAllWithVisibility(
      { transactionHash },
      {
        ...pagingOptions,
        route: `${entityName}/${transactionHash}/logs`,
      },
      visibility
    );
  }
}
