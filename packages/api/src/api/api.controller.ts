import { Controller, Get, Query, Req, Next, UseFilters } from "@nestjs/common";
import { ApiTags, ApiOkResponse, ApiExcludeEndpoint, ApiQuery, ApiExtraModels, ApiOperation } from "@nestjs/swagger";
import { Request, NextFunction } from "express";
import { PagingOptionsWithMaxItemsLimitDto } from "./dtos/common/pagingOptionsWithMaxItemsLimit.dto";
import { ContractAbiResponseDto } from "./dtos/contract/contractAbiResponse.dto";
import { ContractCreationResponseDto, ContractCreationInfoDto } from "./dtos/contract/contractCreationResponse.dto";
import { ContractSourceCodeResponseDto } from "./dtos/contract/contractSourceCodeResponse.dto";
import { TransactionStatusResponseDto, TransactionStatusDto } from "./dtos/transaction/transactionStatusResponse.dto";
import { TransactionReceiptStatusResponseDto } from "./dtos/transaction/transactionReceiptStatusResponse.dto";
import { AccountTransactionDto } from "./dtos/account/accountTransaction.dto";
import { AccountTransactionsResponseDto } from "./dtos/account/accountTransactionsResponse.dto";
import { AccountInternalTransactionDto } from "./dtos/account/accountInternalTransaction.dto";
import { AccountInternalTransactionsResponseDto } from "./dtos/account/accountInternalTransactionsResponse.dto";
import { AccountTokenTransferDto, AccountNFTTransferDto } from "./dtos/account/accountTokenTransfer.dto";
import {
  AccountTokenTransfersResponseDto,
  AccountNFTTransfersResponseDto,
} from "./dtos/account/accountTokenTransfersResponse.dto";
import {
  AccountEtherBalanceResponseDto,
  AccountsEtherBalancesResponseDto,
} from "./dtos/account/accountEtherBalanceResponse.dto";
import { AccountTokenBalanceResponseDto } from "./dtos/account/accountTokenBalanceResponse.dto";
import { BlockNumberResponseDto } from "./dtos/block/blockNumberResponse.dto";
import { BlockCountdownResponseDto } from "./dtos/block/blockCountdownResponse.dto";
import { BlockRewardResponseDto } from "./dtos/block/blockRewardResponse.dto";
import { ApiRequestQuery, ApiModule } from "./types";
import { ParseModulePipe } from "./pipes/parseModule.pipe";
import { ParseActionPipe } from "./pipes/parseAction.pipe";
import { ApiExceptionFilter } from "./exceptionFilter";

@Controller("")
export class ApiController {
  @ApiExcludeEndpoint()
  @Get("api")
  @UseFilters(ApiExceptionFilter)
  public async apiHandler(
    @Req() request: Request,
    @Next() next: NextFunction,
    @Query("module", new ParseModulePipe()) module: ApiModule,
    @Query(new ParseActionPipe()) action: string,
    @Query() query: ApiRequestQuery
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { module: queryModule, action: queryAction, ...queryParams } = query;
    request.url = `/api/${module}/${action}`;
    request.query = queryParams;
    next();
  }

  @ApiTags("Contract API")
  @Get("api?module=contract&action=getabi")
  @ApiOperation({ summary: "Fetch the ABI for a given contract address" })
  @ApiQuery({
    name: "address",
    description: "The contract address that has a verified source code",
    example: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
    required: true,
  })
  @ApiOkResponse({
    description: "Contract ABI",
    type: ContractAbiResponseDto,
  })
  public async getContractAbi(): Promise<ContractAbiResponseDto> {
    return null;
  }

  @ApiTags("Contract API")
  @Get("api?module=contract&action=getsourcecode")
  @ApiOperation({ summary: "Fetch the source code for a given contract address" })
  @ApiQuery({
    name: "address",
    description: "The contract address that has a verified source code",
    example: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
    required: true,
  })
  @ApiOkResponse({
    description: "Contract source code",
    type: ContractSourceCodeResponseDto,
  })
  public async getContractSourceCode(): Promise<ContractSourceCodeResponseDto> {
    return null;
  }

  @ApiTags("Contract API")
  @Get("api?module=contract&action=getcontractcreation")
  @ApiOperation({ summary: "Fetch creation details for a list of contract addresses" })
  @ApiQuery({
    isArray: true,
    explode: false,
    name: "contractaddresses",
    description: "List of contract addresses, up to 5 at a time",
    example: ["0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594", "0x0E03197d697B592E5AE49EC14E952cddc9b28e14"],
    required: true,
  })
  @ApiExtraModels(ContractCreationInfoDto)
  @ApiOkResponse({
    description: "Contract creation info",
    type: ContractCreationResponseDto,
  })
  public async getContractCreation(): Promise<ContractCreationResponseDto> {
    return null;
  }

  @ApiTags("Transaction API")
  @Get("api?module=transaction&action=getstatus")
  @ApiOperation({ summary: "Fetch the status for a given transaction hash" })
  @ApiQuery({
    name: "txhash",
    description: "The transaction hash to check the execution status",
    example: "0x04a4757cd59681b037c1e7bd2402cc45a23c66ed7497614879376719d34e020a",
    required: true,
  })
  @ApiExtraModels(TransactionStatusDto)
  @ApiOkResponse({
    description: "Status code of a contract execution",
    type: TransactionStatusResponseDto,
  })
  public async getTransactionStatus(): Promise<TransactionStatusResponseDto> {
    return null;
  }

  @ApiTags("Transaction API")
  @Get("api?module=transaction&action=gettxreceiptstatus")
  @ApiOperation({ summary: "Fetch the receipt status for a given transaction hash" })
  @ApiQuery({
    name: "txhash",
    description: "The transaction hash to check the execution status",
    example: "0x04a4757cd59681b037c1e7bd2402cc45a23c66ed7497614879376719d34e020a",
    required: true,
  })
  @ApiOkResponse({
    description: "Status code of a transaction execution",
    type: TransactionReceiptStatusResponseDto,
  })
  public async getTransactionReceiptStatus(): Promise<TransactionReceiptStatusResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=txlist")
  @ApiOperation({ summary: "Retrieve transactions for a given address" })
  @ApiQuery({
    name: "address",
    description: "The address to filter transactions by",
    example: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
    required: true,
  })
  @ApiQuery({
    name: "startblock",
    type: "integer",
    description: "The block number to start searching for transactions",
    example: 0,
    required: false,
  })
  @ApiQuery({
    name: "endblock",
    type: "integer",
    description: "The block number to stop searching for transactions",
    example: 99999999,
    required: false,
  })
  @ApiExtraModels(AccountTransactionDto)
  @ApiOkResponse({
    description: "Account transactions list",
    type: AccountTransactionsResponseDto,
  })
  public async getAccountTransactions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<AccountTransactionsResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=txlistinternal")
  @ApiOperation({ summary: "Retrieve internal transactions for a given address or transaction hash" })
  @ApiQuery({
    name: "address",
    description: "The address to filter internal transactions by",
    example: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
    required: false,
  })
  @ApiQuery({
    name: "txhash",
    description: "The transaction hash to filter internal transaction by",
    example: "0x04a4757cd59681b037c1e7bd2402cc45a23c66ed7497614879376719d34e020a",
    required: false,
  })
  @ApiQuery({
    name: "startblock",
    type: "integer",
    description: "The block number to start searching for internal transactions",
    example: 0,
    required: false,
  })
  @ApiQuery({
    name: "endblock",
    type: "integer",
    description: "The block number to stop searching for internal transactions",
    example: 99999999,
    required: false,
  })
  @ApiExtraModels(AccountInternalTransactionDto)
  @ApiOkResponse({
    description: "Internal transactions list",
    type: AccountInternalTransactionsResponseDto,
  })
  public async getAccountInternalTransactions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<AccountInternalTransactionsResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=balance")
  @ApiOperation({ summary: "Retrieve the Ether balance for a given address" })
  @ApiQuery({
    name: "address",
    description: "The address to get Ether balance for",
    example: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
    required: true,
  })
  @ApiOkResponse({
    description: "Account Ether balance",
    type: AccountEtherBalanceResponseDto,
  })
  public async getAccountEtherBalance(): Promise<AccountEtherBalanceResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=balancemulti")
  @ApiOperation({ summary: "Retrieve the Ether balances for a list of addresses" })
  @ApiQuery({
    isArray: true,
    explode: false,
    name: "address",
    description: "List of addresses to get Ether balance for",
    example: ["0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28", "0x0E03197d697B592E5AE49EC14E952cddc9b28e14"],
    required: true,
  })
  @ApiOkResponse({
    description: "Accounts Ether balances",
    type: AccountsEtherBalancesResponseDto,
  })
  public async getAccountsEtherBalances(): Promise<AccountsEtherBalancesResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=tokenbalance")
  @ApiOperation({ summary: "Retrieve token balance for a specific address" })
  @ApiQuery({
    name: "address",
    description: "The address to get Token balance for",
    example: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
    required: true,
  })
  @ApiQuery({
    name: "contractaddress",
    description: "The Token contract address to get balance for",
    example: "0x0faF6df7054946141266420b43783387A78d82A9",
    required: true,
  })
  @ApiOkResponse({
    description: "Account Token balance",
    type: AccountTokenBalanceResponseDto,
  })
  public async getAccountTokenBalance(): Promise<AccountTokenBalanceResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=tokentx")
  @ApiOperation({ summary: "Retrieve token transfers for a specific address or token contract" })
  @ApiQuery({
    name: "address",
    description: "The address to get transfers for",
    example: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
    required: false,
  })
  @ApiQuery({
    name: "contractaddress",
    description: "The Token contract address to get transfers for",
    example: "0x0faF6df7054946141266420b43783387A78d82A9",
    required: false,
  })
  @ApiQuery({
    name: "startblock",
    type: "integer",
    description: "The block number to start searching for transfers",
    example: 0,
    required: false,
  })
  @ApiQuery({
    name: "endblock",
    type: "integer",
    description: "The block number to stop searching for transfers",
    example: 99999999,
    required: false,
  })
  @ApiExtraModels(AccountTokenTransferDto)
  @ApiOkResponse({
    description: "Token transfers",
    type: AccountTokenTransfersResponseDto,
  })
  public async getAccountTokenTransfers(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<AccountTokenTransfersResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=tokennfttx")
  @ApiOperation({ summary: "Retrieve NFT transfers for a specific address" })
  @ApiQuery({
    name: "address",
    description: "The address to get transfers for",
    example: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
    required: false,
  })
  @ApiQuery({
    name: "contractaddress",
    description: "The Token contract address to get transfers for",
    example: "0x0faF6df7054946141266420b43783387A78d82A9",
    required: false,
  })
  @ApiQuery({
    name: "startblock",
    type: "integer",
    description: "The block number to start searching for transfers",
    example: 0,
    required: false,
  })
  @ApiQuery({
    name: "endblock",
    type: "integer",
    description: "The block number to stop searching for transfers",
    example: 99999999,
    required: false,
  })
  @ApiExtraModels(AccountNFTTransferDto)
  @ApiOkResponse({
    description: "NFT transfers",
    type: AccountNFTTransfersResponseDto,
  })
  public async getAccountNFTTransfers(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<AccountNFTTransfersResponseDto> {
    return null;
  }

  @ApiTags("Block API")
  @Get("api?module=block&action=getblocknobytime")
  @ApiOperation({ summary: "Retrieve block number closest to a specific timestamp" })
  @ApiQuery({
    name: "timestamp",
    type: "integer",
    description: "The integer representing the Unix timestamp in seconds",
    example: 1635934550,
    required: true,
  })
  @ApiQuery({
    name: "closest",
    type: "string",
    description: "The closest available block to the provided timestamp, either before or after",
    example: "before",
    required: false,
  })
  @ApiOkResponse({
    description: "Returns the block number that was mined at a certain timestamp",
    type: BlockNumberResponseDto,
  })
  public async getBlockNumberByTimestamp(): Promise<BlockNumberResponseDto> {
    return null;
  }

  @ApiTags("Block API")
  @Get("api?module=block&action=getblockcountdown")
  @ApiOperation({ summary: "Retrieve countdown details for a specific block number" })
  @ApiQuery({
    name: "blockno",
    type: "integer",
    description: "The integer block number to estimate time remaining to be mined",
    example: 12697906,
    required: true,
  })
  @ApiOkResponse({
    description: "Returns the estimated time remaining, in seconds, until a certain block is mined",
    type: BlockCountdownResponseDto,
  })
  public async getBlockCountdown(): Promise<BlockCountdownResponseDto> {
    return null;
  }

  @ApiTags("Block API")
  @Get("api?module=block&action=getblockreward")
  @ApiOperation({ summary: "Retrieve block reward details for a specific block number" })
  @ApiQuery({
    name: "blockno",
    type: "integer",
    description: "The integer block number to check block rewards",
    example: 12697906,
    required: true,
  })
  @ApiOkResponse({
    description: "Returns block rewards",
    type: BlockRewardResponseDto,
  })
  public async getBlockRewards(): Promise<BlockRewardResponseDto> {
    return null;
  }
}
