import { Injectable, Logger } from "@nestjs/common";
import { BlockchainService, TransactionTrace } from "../blockchain/blockchain.service";
import { type Block, type TransactionResponse, type TransactionReceipt } from "ethers";
import { TokenService, Token, TokenType } from "../token/token.service";
import {
  L2_PROTOCOL_UPGRADES_CALLER_ADDRESS,
  L2_CONTRACT_DEPLOYER_ADDRESS,
  CONTRACT_INTERFACES,
  BASE_TOKEN_ADDRESS,
} from "../constants";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { TransferType } from "../transfer/transfer.service";
import { unixTimeToDate } from "../utils/date";

export interface ContractAddress {
  address: string;
  blockNumber: number;
  transactionHash: string;
  creatorAddress: string;
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
  extractedData: ExtractedTraceData = undefined
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
    if (["create", "create2"].includes(traceType) && !transactionTrace.error) {
      extractedData.contractAddresses.push({
        address: transactionTrace.to,
        blockNumber: transaction.blockNumber,
        transactionHash: transaction.hash,
        creatorAddress: transaction.from,
        logIndex: extractedData.contractAddresses.length + 1,
      });
    }

    // DELEGATECALL and STATICCALL cannot transfer ETH.
    if (
      transactionTrace.value !== "0x0" &&
      !transactionTrace.error &&
      !["delegatecall", "staticcall"].includes(traceType)
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
      getTransactionTraceData(block, transaction, subCall, extractedData);
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
    const extractedTraceData = getTransactionTraceData(block, transaction, transactionTrace);
    const transactionTraceData: TransactionTraceData = {
      contractAddresses: extractedTraceData.contractAddresses,
      error: extractedTraceData.error,
      revertReason: extractedTraceData.revertReason,
      transfers: extractedTraceData.transfersWithValue,
      tokens: [],
    };

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
      message: "Requesting contracts' bytecode and bytecode hashes",
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
