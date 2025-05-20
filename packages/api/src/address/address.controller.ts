import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiExtraModels,
  refs,
  ApiExcludeController,
} from "@nestjs/swagger";
import { Pagination } from "nestjs-typeorm-paginate";
import { PagingOptionsWithMaxItemsLimitDto, ListFiltersDto } from "../common/dtos";
import { ApiListPageOkResponse } from "../common/decorators/apiListPageOkResponse";
import { buildDateFilter } from "../common/utils";
import { AddressService } from "./address.service";
import { BlockService } from "../block/block.service";
import { TransactionService } from "../transaction/transaction.service";
import { BalanceService } from "../balance/balance.service";
import { ContractDto, AccountDto, TokenAddressDto, FilterAddressTransfersOptionsDto } from "./dtos";
import { LogDto } from "../log/log.dto";
import { LogService } from "../log/log.service";
import { ParseAddressPipe, ADDRESS_REGEX_PATTERN } from "../common/pipes/parseAddress.pipe";
import { TransferService } from "../transfer/transfer.service";
import { TransferDto } from "../transfer/transfer.dto";
import { swagger } from "../config/featureFlags";
import { constants } from "../config/docs";

const entityName = "address";

@ApiTags("Address BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class AddressController {
  constructor(
    protected readonly addressService: AddressService,
    protected readonly blockService: BlockService,
    protected readonly transactionService: TransactionService,
    protected readonly logService: LogService,
    protected readonly balanceService: BalanceService,
    protected readonly transferService: TransferService
  ) {}

  @Get(":address")
  @ApiParam({
    name: "address",
    type: String,
    schema: { pattern: ADDRESS_REGEX_PATTERN },
    example: constants.address,
    description: "Valid hex address",
  })
  @ApiExtraModels(AccountDto, ContractDto)
  @ApiExtraModels(TokenAddressDto)
  @ApiOkResponse({
    description: "Address was returned successfully",
    schema: { oneOf: refs(AccountDto, ContractDto) },
  })
  @ApiBadRequestResponse({ description: "Specified address is invalid" })
  public async getAddress(
    @Param("address", new ParseAddressPipe()) address: string
  ): Promise<AccountDto | ContractDto> {
    return this.addressService.findFullAddress(address, true);
  }

  @Get(":address/logs")
  @ApiParam({
    name: "address",
    type: String,
    schema: { pattern: ADDRESS_REGEX_PATTERN },
    example: constants.contractAddressWithLogs,
    description: "Valid hex address",
  })
  @ApiListPageOkResponse(LogDto, { description: "Successfully returned address logs" })
  @ApiBadRequestResponse({
    description: "Specified address is invalid or paging query params are not valid or out of range",
  })
  public async getAddressLogs(
    @Param("address", new ParseAddressPipe()) address: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<Pagination<LogDto>> {
    return await this.logService.findAll(
      { address },
      {
        ...pagingOptions,
        route: `${entityName}/${address}/logs`,
      }
    );
  }

  @Get(":address/transfers")
  @ApiParam({
    name: "address",
    type: String,
    schema: { pattern: ADDRESS_REGEX_PATTERN },
    example: constants.address,
    description: "Valid hex address",
  })
  @ApiListPageOkResponse(TransferDto, { description: "Successfully returned address transfers" })
  @ApiBadRequestResponse({
    description: "Specified address is invalid or paging query params are not valid or out of range",
  })
  public async getAddressTransfers(
    @Param("address", new ParseAddressPipe()) address: string,
    @Query() filterAddressTransferOptions: FilterAddressTransfersOptionsDto,
    @Query() listFilterOptions: ListFiltersDto,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<Pagination<TransferDto>> {
    const filterTransfersListOptions = buildDateFilter(listFilterOptions.fromDate, listFilterOptions.toDate);

    return await this.transferService.findAll(
      {
        address,
        ...filterTransfersListOptions,
        ...(filterAddressTransferOptions.type
          ? {
              type: filterAddressTransferOptions.type,
            }
          : {
              isFeeOrRefund: false,
            }),
      },
      {
        filterOptions: { ...filterAddressTransferOptions, ...listFilterOptions },
        ...pagingOptions,
        route: `${entityName}/${address}/transfers`,
      }
    );
  }
}
