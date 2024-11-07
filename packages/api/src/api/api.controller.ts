import { Controller, Get, Query, Req, Next, UseFilters, Post, Body } from "@nestjs/common";
import {
  ApiTags,
  ApiOkResponse,
  ApiExcludeEndpoint,
  ApiQuery,
  ApiExtraModels,
  ApiOperation,
  ApiBody,
} from "@nestjs/swagger";
import { Request, NextFunction } from "express";
import { PagingOptionsWithMaxItemsLimitDto } from "./dtos/common/pagingOptionsWithMaxItemsLimit.dto";
import { SortingOptionsDto } from "./dtos/common/sortingOptions.dto";
import { ContractAbiResponseDto } from "./dtos/contract/contractAbiResponse.dto";
import { ContractCreationResponseDto, ContractCreationInfoDto } from "./dtos/contract/contractCreationResponse.dto";
import { ContractSourceCodeResponseDto } from "./dtos/contract/contractSourceCodeResponse.dto";
import { VerifyContractRequestDto } from "./dtos/contract/verifyContractRequest.dto";
import { VerifyContractResponseDto } from "./dtos/contract/verifyContractResponse.dto";
import { ContractVerificationStatusResponseDto } from "./dtos/contract/contractVerificationStatusResponse.dto";
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
import { AccountMinedBlock } from "./dtos/account/accountMinedBlock.dto";
import { AccountMinedBlocksResponseDto } from "./dtos/account/accountMinedBlocksResponse.dto";
import { BlockNumberResponseDto } from "./dtos/block/blockNumberResponse.dto";
import { BlockCountdownResponseDto } from "./dtos/block/blockCountdownResponse.dto";
import { BlockRewardResponseDto } from "./dtos/block/blockRewardResponse.dto";
import { ApiRequestQuery, ApiModule } from "./types";
import { ParseModulePipe } from "./pipes/parseModule.pipe";
import { ParseActionPipe } from "./pipes/parseAction.pipe";
import { ApiExceptionFilter } from "./exceptionFilter";
import { LogsResponseDto, LogApiDto } from "./dtos/log/logs.dto";
import { TokenInfoResponseDto, TokenInfoDto } from "./dtos/token/tokenInfo.dto";
import { EthPriceResponseDto, EthPriceDto } from "./dtos/stats/ethPrice.dto";
import { constants } from "../config/docs";

@Controller("")
export class ApiController {
  @ApiExcludeEndpoint()
  @Get("api")
  @UseFilters(ApiExceptionFilter)
  public async apiGetHandler(
    @Req() request: Request,
    @Next() next: NextFunction,
    @Query(new ParseActionPipe()) action: string,
    @Query("module", new ParseModulePipe()) module: ApiModule,
    @Query() query: ApiRequestQuery
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { module: queryModule, action: queryAction, ...queryParams } = query;
    request.url = `/api/${module}/${action}`;
    request.query = queryParams;
    next();
  }

  @ApiExcludeEndpoint()
  @Post("api")
  @UseFilters(ApiExceptionFilter)
  public async apiPostHandler(
    @Req() request: Request,
    @Next() next: NextFunction,
    @Body(new ParseActionPipe()) action: string,
    @Body("module", new ParseModulePipe()) module: ApiModule
  ) {
    request.url = `/api/${module}/${action}`;
    next();
  }

  @ApiTags("Contract API")
  @Get("api?module=contract&action=getabi")
  @ApiOperation({ summary: "Fetch the ABI for a given contract address" })
  @ApiQuery({
    name: "address",
    type: String,
    description: "The contract address that has a verified source code",
    example: constants.verifiedContractAddress,
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
    type: String,
    description: "The contract address that has a verified source code",
    example: constants.verifiedContractAddress,
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
    type: [String],
    explode: false,
    name: "contractaddresses",
    description: "List of contract addresses, up to 5 at a time",
    example: [constants.verifiedContractAddress, constants.verifiedContractAddress2],
    required: true,
  })
  @ApiExtraModels(ContractCreationInfoDto)
  @ApiOkResponse({
    description: "Contract creation information",
    type: ContractCreationResponseDto,
  })
  public async getContractCreation(): Promise<ContractCreationResponseDto> {
    return null;
  }

  @ApiTags("Contract API")
  @Post("api")
  @ApiOperation({ summary: "Submits a contract source code for verification" })
  @ApiBody({ type: VerifyContractRequestDto })
  @ApiOkResponse({
    description: "Verification ID for the submission",
    type: VerifyContractResponseDto,
  })
  public async verifyContractSourceCode(): Promise<VerifyContractResponseDto> {
    return null;
  }

  @ApiTags("Contract API")
  @Get("api?module=contract&action=checkverifystatus")
  @ApiOperation({ summary: "Check source code verification submission status" })
  @ApiQuery({
    name: "guid",
    type: String,
    description: "Verification ID",
    example: "44071",
    required: true,
  })
  @ApiOkResponse({
    description: "Source code verification status",
    type: ContractVerificationStatusResponseDto,
  })
  public async getVerificationStatus(): Promise<ContractVerificationStatusResponseDto> {
    return null;
  }

  @ApiTags("Transaction API")
  @Get("api?module=transaction&action=getstatus")
  @ApiOperation({ summary: "Fetch the status for a given transaction hash" })
  @ApiQuery({
    name: "txhash",
    type: String,
    description: "The transaction hash to check the execution status",
    example: constants.txHash,
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
    type: String,
    description: "The transaction hash to check the execution status",
    example: constants.txHash,
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
    type: String,
    description: "The address to filter transactions by",
    example: constants.address,
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
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() sortingOptions: SortingOptionsDto
  ): Promise<AccountTransactionsResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=txlistinternal")
  @ApiOperation({
    summary: "Retrieve internal transactions for a given blocks range (only transfers are supported for now)",
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
  public async getInternalTransactions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() sortingOptions: SortingOptionsDto
  ): Promise<AccountInternalTransactionsResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=txlistinternal&address=")
  @ApiOperation({
    summary: "Retrieve internal transactions for a given address (only transfers are supported for now)",
  })
  @ApiQuery({
    name: "address",
    type: String,
    description: "The address to filter internal transactions by",
    example: constants.addressWithInternalTx,
    required: true,
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
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() sortingOptions: SortingOptionsDto
  ): Promise<AccountInternalTransactionsResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=txlistinternal&txhash=")
  @ApiOperation({
    summary: "Retrieve internal transactions for a given transaction hash (only transfers are supported for now)",
  })
  @ApiQuery({
    name: "txhash",
    type: String,
    description: "The transaction hash to filter internal transaction by",
    example: constants.addressTxWithInternalTransfers,
    required: true,
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
  public async getInternalTransactionsByTxHash(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() sortingOptions: SortingOptionsDto
  ): Promise<AccountInternalTransactionsResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=balance")
  @ApiOperation({ summary: "Retrieve the balance for a given address" })
  @ApiQuery({
    name: "address",
    type: String,
    description: "The address to get Ether balance for",
    example: constants.address,
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
  @ApiOperation({ summary: "Retrieve the balances for a list of addresses" })
  @ApiQuery({
    isArray: true,
    type: [String],
    explode: false,
    name: "address",
    description: "List of addresses to get Ether balance for",
    example: [constants.address, constants.addressWithInternalTx],
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
    type: String,
    description: "The address to get Token balance for",
    example: constants.address,
    required: true,
  })
  @ApiQuery({
    name: "contractaddress",
    type: String,
    description: "The Token contract address to get balance for",
    example: constants.erc20TokenAddress,
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
    type: String,
    description: "The address to get transfers for",
    example: constants.address,
    required: false,
  })
  @ApiQuery({
    name: "contractaddress",
    type: String,
    description: "The Token contract address to get transfers for",
    example: constants.erc20TokenAddress,
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
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() sortingOptions: SortingOptionsDto
  ): Promise<AccountTokenTransfersResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=tokennfttx")
  @ApiOperation({ summary: "Retrieve NFT transfers for a specific address" })
  @ApiQuery({
    name: "address",
    type: String,
    description: "The address to get transfers for",
    example: constants.erc721TokenHolderAddress,
    required: false,
  })
  @ApiQuery({
    name: "contractaddress",
    type: String,
    description: "The Token contract address to get transfers for",
    example: constants.erc721TokenAddress,
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
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() sortingOptions: SortingOptionsDto
  ): Promise<AccountNFTTransfersResponseDto> {
    return null;
  }

  @ApiTags("Account API")
  @Get("api?module=account&action=getminedblocks")
  @ApiOperation({ summary: "Get list of Blocks Validated by Address" })
  @ApiQuery({
    name: "address",
    type: String,
    description: "The address to get validated blocks by",
    example: "0x0000000000000000000000000000000000000000",
    required: true,
  })
  @ApiExtraModels(AccountMinedBlock)
  @ApiOkResponse({
    description: "Blocks validated by address",
    type: AccountMinedBlocksResponseDto,
  })
  public async getAccountMinedBlocks(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<AccountMinedBlocksResponseDto> {
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
    type: String,
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
    example: 20697906,
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
    example: 1500,
    required: true,
  })
  @ApiOkResponse({
    description: "Returns block rewards",
    type: BlockRewardResponseDto,
  })
  public async getBlockRewards(): Promise<BlockRewardResponseDto> {
    return null;
  }

  @ApiTags("Logs API")
  @Get("api?module=logs&action=getLogs")
  @ApiOperation({ summary: "Retrieve the event logs for an address, with optional filtering by block range" })
  @ApiQuery({
    name: "address",
    type: String,
    description: "The address to filter logs by",
    example: constants.contractAddressWithLogs,
    required: true,
  })
  @ApiQuery({
    name: "fromBlock",
    type: "integer",
    description: "The integer block number to start searching for logs",
    example: 0,
    required: false,
  })
  @ApiQuery({
    name: "toBlock",
    type: "integer",
    description: "The integer block number to stop searching for logs ",
    example: 99999999,
    required: false,
  })
  @ApiExtraModels(LogApiDto)
  @ApiOkResponse({
    description: "Returns event logs for an address",
    type: LogsResponseDto,
  })
  public async getLogs(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto
  ): Promise<LogsResponseDto> {
    return null;
  }

  @ApiTags("Token API")
  @Get("api?module=token&action=tokeninfo")
  @ApiOperation({
    summary:
      "Returns token information. Token price, liquidity and icon are retrieved from CoinGecko. The data is updated every 24 hours.",
  })
  @ApiQuery({
    name: "contractaddress",
    type: String,
    description: "The contract address of the ERC-20/ERC-721 token to retrieve token info",
    example: constants.tokenAddress,
    required: true,
  })
  @ApiExtraModels(TokenInfoDto)
  @ApiOkResponse({
    description: "Token information",
    type: TokenInfoResponseDto,
  })
  public async tokenInfo(): Promise<TokenInfoResponseDto> {
    return null;
  }

  @ApiTags("Stats API")
  @Get("api?module=stats&action=ethprice")
  @ApiOperation({ summary: "Returns price of 1 ETH" })
  @ApiExtraModels(EthPriceDto)
  @ApiOkResponse({
    description: "ETH price",
    type: EthPriceResponseDto,
  })
  public async ethPrice(): Promise<EthPriceResponseDto> {
    return null;
  }
}
