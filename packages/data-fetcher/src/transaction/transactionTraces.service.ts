import { Injectable, Logger } from "@nestjs/common";
import { BlockchainService, TransactionTrace } from "../blockchain/blockchain.service";
import { type Block, type TransactionResponse, type TransactionReceipt } from "ethers";
import { TokenService, Token, TokenType } from "../token/token.service";
import {
  L2_PROTOCOL_UPGRADES_CALLER_ADDRESS,
  L2_CONTRACT_DEPLOYER_ADDRESS,
  CONTRACT_INTERFACES,
  BASE_TOKEN_ADDRESS,
  L1_TO_L2_TX_TYPE,
} from "../constants";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { TransferType } from "../transfer/transfer.service";
import { unixTimeToDate } from "../utils/date";

export interface ContractAddress {
  address: string;
  blockNumber: number;
  transactionHash: string;
  creatorAddress: string;
  // Address that executed the CREATE/CREATE2
  deployerAddress?: string;
  logIndex: number;
  bytecode?: string;
  isEvmLike?: boolean;
}

export interface TransactionTraceData {
  contractAddresses: ContractAddress[];
  transfers: Transfer[];
  error?: string;
  revertReason?: string;
  tokens?: Token[];
}

interface ExtractedTraceData {
  contractAddresses: ContractAddress[];
  transfersWithValue: Transfer[];
  error?: string;
  revertReason?: string;
}

function getTransactionTraceData(
  block: Block,
  transaction: TransactionResponse,
  transactionTrace: TransactionTrace,
  extractedData: ExtractedTraceData = undefined,
  isAncestorFailed = false
): ExtractedTraceData {
  if (!extractedData) {
    extractedData = {
      contractAddresses: [],
      transfersWithValue: [],
      error: transactionTrace?.error,
      revertReason: transactionTrace?.revertReason,
    };
  }

  if (transactionTrace) {
    const traceType = transactionTrace.type.toLowerCase();
    // Frame effects are rolled back if the frame or any of its ancestors failed.
    // A frame without `to` (e.g. a CREATE that did not complete) is treated as failed.
    const isFailed = isAncestorFailed || !!transactionTrace.error || !transactionTrace.to;
    if (["create", "create2"].includes(traceType) && !isFailed) {
      extractedData.contractAddresses.push({
        address: transactionTrace.to,
        blockNumber: transaction.blockNumber,
        transactionHash: transaction.hash,
        creatorAddress: transaction.from,
        deployerAddress: transactionTrace.from,
        logIndex: extractedData.contractAddresses.length + 1,
      });
    }

    // DELEGATECALL and STATICCALL cannot transfer ETH, CALLCODE transfers ETH to the caller itself.
    if (
      transactionTrace.value !== "0x0" &&
      !isFailed &&
      !["delegatecall", "staticcall", "callcode"].includes(traceType)
    ) {
      extractedData.transfersWithValue.push({
        from: transactionTrace.from.toLowerCase(),
        to: transactionTrace.to.toLowerCase(),
        transactionHash: transaction.hash,
        blockNumber: transaction.blockNumber,
        amount: BigInt(transactionTrace.value),
        tokenAddress: BASE_TOKEN_ADDRESS,
        type: TransferType.Transfer,
        tokenType: TokenType.BaseToken,
        isFeeOrRefund: false,
        logIndex: extractedData.transfersWithValue.length + 1,
        transactionIndex: transaction.index,
        timestamp: unixTimeToDate(block.timestamp),
      });
    }

    transactionTrace.calls?.forEach((subCall) => {
      getTransactionTraceData(block, transaction, subCall, extractedData, isFailed);
    });
  }

  return extractedData;
}

@Injectable()
export class TransactionTracesService {
  private readonly logger: Logger;

  constructor(private readonly blockchainService: BlockchainService, private readonly tokenService: TokenService) {
    this.logger = new Logger(TransactionTracesService.name);
  }

  public async getData(
    block: Block,
    transaction: TransactionResponse,
    transactionReceipt: TransactionReceipt,
    transactionTrace: TransactionTrace | null
  ): Promise<TransactionTraceData> {
    this.logger.debug({
      message: "Fetching traces and extracting trace data",
      blockNumber: transaction.blockNumber,
      transactionHash: transaction.hash,
    });
    // Effects of a failed transaction are rolled back even if the trace does not report the failure
    const extractedTraceData = getTransactionTraceData(
      block,
      transaction,
      transactionTrace,
      undefined,
      transactionReceipt.status === 0
    );
    const transactionTraceData: TransactionTraceData = {
      contractAddresses: extractedTraceData.contractAddresses,
      error: extractedTraceData.error,
      revertReason: extractedTraceData.revertReason,
      transfers: extractedTraceData.transfersWithValue,
      tokens: [],
    };

    // Check if transaction is a successful deposit
    const isDeposit = transaction.type === L1_TO_L2_TX_TYPE && transaction.value > 0 && transactionReceipt.status === 1;
    const [rootTransfer] = transactionTraceData.transfers;
    // The deposited value is transferred by the root trace frame if there is one, so it is marked as the deposit
    if (
      isDeposit &&
      rootTransfer?.from === transaction.from.toLowerCase() &&
      rootTransfer.to === transaction.to.toLowerCase() &&
      rootTransfer.amount === BigInt(transaction.value)
    ) {
      rootTransfer.type = TransferType.Deposit;
    } else if (isDeposit) {
      transactionTraceData.transfers.push({
        from: transaction.from.toLowerCase(),
        to: transaction.to.toLowerCase(),
        transactionHash: transaction.hash,
        blockNumber: transaction.blockNumber,
        amount: BigInt(transaction.value),
        tokenAddress: BASE_TOKEN_ADDRESS,
        type: TransferType.Deposit,
        tokenType: TokenType.BaseToken,
        isFeeOrRefund: false,
        logIndex: transactionTraceData.transfers.length + 1,
        transactionIndex: transaction.index,
        timestamp: unixTimeToDate(block.timestamp),
      });
    }

    // TODO: check how system upgrades are performed in ZKsync OS
    // Process such txs properly, remove the code below if not relevant
    //
    // Extract upgraded contract addresses from the protocol upgrade transaction. Add them to the trace data so they can be
    // processed later like any other contract address.
    //
    // System contracts upgrades don't have `create` traces and are performed via a call to the ContractDeployer's
    //  `forceDeployOnAddresses` function.' The caller is always 0x0000000000000000000000000000000000008007.
    if (transaction.from === L2_PROTOCOL_UPGRADES_CALLER_ADDRESS && transaction.to === L2_CONTRACT_DEPLOYER_ADDRESS) {
      const parsedTx = CONTRACT_INTERFACES.L2_CONTRACT_DEPLOYER.interface.parseTransaction(transaction);
      parsedTx.args._deployments.forEach((deployment) => {
        transactionTraceData.contractAddresses.push({
          address: deployment.newAddress,
          blockNumber: transaction.blockNumber,
          transactionHash: transaction.hash,
          creatorAddress: transaction.from,
          logIndex: transactionTraceData.contractAddresses.length + 1,
        });
      });
    }

    this.logger.debug({
      message: "Requesting contracts' bytecode",
      blockNumber: transaction.blockNumber,
    });
    transactionTraceData.contractAddresses = (
      await Promise.all(
        transactionTraceData.contractAddresses.map(async (contractAddress) => {
          contractAddress.bytecode = await this.blockchainService.getCode(contractAddress.address);
          // Always an EVM-like contract for zksync-os
          contractAddress.isEvmLike = true;
          return contractAddress;
        })
      )
    ).filter(
      // Filter out the contracts with no or empty bytecode. An edge case that might happen
      // when the contract was deployed (there was a create trace), but it was destructed in
      // the same transaction.
      (contractAddress) => contractAddress.bytecode?.length > 2
    );

    this.logger.debug({
      message: "Extracting ERC20 tokens",
      blockNumber: transaction.blockNumber,
      transactionHash: transaction.hash,
    });
    transactionTraceData.tokens = (
      await Promise.all(
        transactionTraceData.contractAddresses.map((contractAddress) =>
          this.tokenService.getERC20Token(contractAddress, transactionReceipt)
        )
      )
    ).filter((token) => !!token);

    return transactionTraceData;
  }
}
