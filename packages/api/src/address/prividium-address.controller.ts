import { Controller, Get, NotFoundException, Param, Query, Req } from "@nestjs/common";
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
import { AddressController } from "./address.controller";
import { Request } from "express";
import { mock } from "jest-mock-extended";

const entityName = "address";

@ApiTags("Address BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class PrividiumAddressController extends AddressController {
  constructor(
    addressService: AddressService,
    blockService: BlockService,
    transactionService: TransactionService,
    logService: LogService,
    balanceService: BalanceService,
    transferService: TransferService
  ) {
    super(addressService, blockService, transactionService, logService, balanceService, transferService);
  }

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
    @Param("address", new ParseAddressPipe()) address: string,
    @Req() req: Request
  ): Promise<AccountDto | ContractDto> {
    const userAddress = req.session.siwe.address;
    const addressRecord = await this.addressService.findOne(address);
    const isContract = !!(addressRecord && addressRecord.bytecode.length > 2);

    if (isContract) {
      const contractOwner = await this.logService.findContractOwner(address);
      const paddedUser = "0x" + userAddress.replace("0x", "").padStart(64, "0");
      return super.getAddress(address, req, paddedUser === contractOwner);
    }

    if (userAddress !== address) {
      throw new NotFoundException();
    }

    return super.getAddress(address, mock<Request>());
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
    return super.getAddressLogs(address, pagingOptions);
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
    return super.getAddressTransfers(address, filterAddressTransferOptions, listFilterOptions, pagingOptions);
  }
}
