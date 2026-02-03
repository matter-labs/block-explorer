import { Controller, ForbiddenException, Get, Logger, Param, Query } from "@nestjs/common";
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
import { getAddress as ethersGetAddress } from "ethers";
import { PagingOptionsWithMaxItemsLimitDto, ListFiltersDto } from "../common/dtos";
import { ApiListPageOkResponse } from "../common/decorators/apiListPageOkResponse";
import { formatHexAddress, buildDateFilter, isAddressEqual } from "../common/utils";
import { AddressService } from "./address.service";
import { BlockService } from "../block/block.service";
import { TransactionService } from "../transaction/transaction.service";
import { BalanceService } from "../balance/balance.service";
import { AddressType, ContractDto, AccountDto, TokenAddressDto, FilterAddressTransfersOptionsDto } from "./dtos";
import { LogDto } from "../log/log.dto";
import { LogService } from "../log/log.service";
import { ParseAddressPipe, ADDRESS_REGEX_PATTERN } from "../common/pipes/parseAddress.pipe";
import { TransferService } from "../transfer/transfer.service";
import { TransferDto } from "../transfer/transfer.dto";
import { swagger } from "../config/featureFlags";
import { constants } from "../config/docs";
import { User } from "../user/user.decorator";
import { AddUserRolesPipe, UserWithRoles } from "../api/pipes/addUserRoles.pipe";

const entityName = "address";

@ApiTags("Address BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class AddressController {
  private readonly logger: Logger;

  constructor(
    private readonly addressService: AddressService,
    private readonly blockService: BlockService,
    private readonly transactionService: TransactionService,
    private readonly logService: LogService,
    private readonly balanceService: BalanceService,
    private readonly transferService: TransferService
  ) {
    this.logger = new Logger(AddressController.name);
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
    @User(AddUserRolesPipe) user: UserWithRoles
  ): Promise<AccountDto | ContractDto> {
    const addressRecord = await this.addressService.findOne(address);
    const addressType = !!(addressRecord && addressRecord.bytecode.length > 2)
      ? AddressType.Contract
      : AddressType.Account;
    let includeBalances = true;
    let includeBytecode = true;
    let includeCreatorAddress = true;
    let includeCreatorTxHash = true;

    if (user && !user.isAdmin) {
      // If address is an account and is not own address, forbid access
      if (addressType === AddressType.Account && !isAddressEqual(user.address, address)) {
        throw new ForbiddenException();
      }

      // If address is a contract and user is not owner, don't include additional information
      if (addressType === AddressType.Contract && !(await this.isUserOwnerOfContract(address, user.address))) {
        includeBalances = false;
        includeBytecode = false;
        includeCreatorAddress = false;
        includeCreatorTxHash = false;
      }
    }

    const addressBalance = includeBalances
      ? await this.balanceService.getBalances(address)
      : { blockNumber: 0, balances: {} };

    if (addressType === AddressType.Contract) {
      const totalTransactions = await this.transactionService.count({ "from|to": formatHexAddress(address) });
      return {
        type: AddressType.Contract,
        ...addressRecord,
        blockNumber: addressBalance.blockNumber || addressRecord.createdInBlockNumber,
        balances: addressBalance.balances,
        createdInBlockNumber: addressRecord.createdInBlockNumber,
        creatorTxHash: includeCreatorTxHash ? addressRecord.creatorTxHash : "",
        totalTransactions,
        creatorAddress: includeCreatorAddress ? addressRecord.creatorAddress : "",
        isEvmLike: addressRecord.isEvmLike,
        bytecode: includeBytecode ? addressRecord.bytecode : "",
      };
    }

    if (addressBalance.blockNumber) {
      const [sealedNonce, verifiedNonce] = await Promise.all([
        this.transactionService.getAccountNonce({ accountAddress: address }),
        this.transactionService.getAccountNonce({ accountAddress: address, isVerified: true }),
      ]);

      return {
        type: AddressType.Account,
        address: ethersGetAddress(address),
        blockNumber: addressBalance.blockNumber,
        balances: addressBalance.balances,
        sealedNonce,
        verifiedNonce,
      };
    }

    return {
      type: AddressType.Account,
      address: ethersGetAddress(address),
      blockNumber: await this.blockService.getLastBlockNumber(),
      balances: {},
      sealedNonce: 0,
      verifiedNonce: 0,
    };
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
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @User(AddUserRolesPipe) user: UserWithRoles
  ): Promise<Pagination<LogDto>> {
    if (user && !user.isAdmin) {
      throw new ForbiddenException();
    }

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
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @User(AddUserRolesPipe) user: UserWithRoles
  ): Promise<Pagination<TransferDto>> {
    const userFilters = user && !user.isAdmin ? { visibleBy: user.address } : {};

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
        ...userFilters,
      },
      {
        filterOptions: { ...filterAddressTransferOptions, ...listFilterOptions },
        ...pagingOptions,
        route: `${entityName}/${address}/transfers`,
      }
    );
  }

  /**
   * Checks if a user is the owner of a contract by looking for the most recent
   * OwnershipTransferred event. This only works for contracts that implement
   * the OpenZeppelin Ownable pattern.
   *
   * @param contractAddress - The contract address to check
   * @param accountAddress - The account address to verify ownership for
   * @returns Promise<boolean> - True if the account is the contract owner
   */
  private async isUserOwnerOfContract(contractAddress: string, accountAddress: string): Promise<boolean> {
    try {
      const OWNERSHIP_TRANSFERRED_TOPIC = "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0";
      const logs = await this.logService.findManyByTopics({
        address: contractAddress,
        topics: {
          topic0: OWNERSHIP_TRANSFERRED_TOPIC,
        },
        page: 1,
        offset: 1,
      });
      if (logs.length === 0) {
        return false;
      }

      const ownerTopic = logs[0].topics[2];
      if (!ownerTopic) {
        return false;
      }

      // Topic is 32 bytes log, so we need to convert it to an address
      // by removing the first 12 bytes and 0x prefix
      const owner = `0x${ownerTopic.slice(2 + 12 * 2)}`;
      return isAddressEqual(owner, accountAddress);
    } catch (err) {
      this.logger.error("Failed to check if user is owner of contract", err.stack);
      return false;
    }
  }
}
