import { Controller, Get, NotFoundException, Param, Query, Req } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiExcludeController,
  ApiExtraModels,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  refs,
} from "@nestjs/swagger";
import { Pagination, createPaginationObject } from "nestjs-typeorm-paginate";
import { ListFiltersDto, PagingOptionsWithMaxItemsLimitDto } from "../common/dtos";
import { ApiListPageOkResponse } from "../common/decorators/apiListPageOkResponse";
import { AddressService } from "./address.service";
import { AccountDto, ContractDto, FilterAddressTransfersOptionsDto, TokenAddressDto } from "./dtos";
import { LogDto } from "../log/log.dto";
import { LogService } from "../log/log.service";
import { ADDRESS_REGEX_PATTERN, ParseAddressPipe } from "../common/pipes/parseAddress.pipe";
import { TransferService } from "../transfer/transfer.service";
import { TransferDto } from "../transfer/transfer.dto";
import { swagger } from "../config/featureFlags";
import { constants } from "../config/docs";
import { Request } from "express";
import { buildDateFilter, pad } from "../common/utils";

const entityName = "address";

@ApiTags("Address BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class PrividiumAddressController {
  constructor(
    private addressService: AddressService,
    private logService: LogService,
    private transferService: TransferService
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
  public async getPrividiumAddress(
    @Param("address", new ParseAddressPipe()) address: string,
    @Req() req: Request
  ): Promise<AccountDto | ContractDto> {
    const userAddress = req.session.siwe.address;
    const addressRecord = await this.addressService.findOne(address);
    const isUserAddress = userAddress.toLowerCase() === address.toLowerCase();
    const isContract = !!(addressRecord && addressRecord.bytecode.length > 2);

    if (!isContract && !isUserAddress) {
      throw new NotFoundException({ address });
    }

    const showBalanceForContract = isContract && (await this.isOwnerOfContract(userAddress, address));

    return this.addressService.findFullAddress(address, isUserAddress || showBalanceForContract);
  }

  private async isOwnerOfContract(userAddr: string, contractAddr: string): Promise<boolean> {
    const contractOwner = await this.logService.findContractOwnerTopic(contractAddr);
    return contractOwner && contractOwner.toLowerCase() === pad(userAddr).toLowerCase();
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
  public async getPrividiumAddressLogs(
    @Param("address", new ParseAddressPipe()) address: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Req() req: Request
  ): Promise<Pagination<LogDto>> {
    const userAddress = req.session.siwe.address;
    const filter = (await this.isOwnerOfContract(userAddress, address))
      ? { address }
      : { address, someLogMatch: pad(req.session.siwe.address) };

    return await this.logService.findAll(filter, {
      ...pagingOptions,
      route: `${entityName}/${address}/logs`,
    });
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
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Req() req: Request
  ): Promise<Pagination<TransferDto>> {
    const userAddress = req.session.siwe.address;
    if (userAddress.toLowerCase() !== address.toLowerCase()) {
      return createPaginationObject({
        items: [],
        currentPage: 1,
        limit: 10,
      });
    }

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
