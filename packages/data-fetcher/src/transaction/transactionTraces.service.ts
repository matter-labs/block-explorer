import { Injectable, Logger } from "@nestjs/common";
import { types, utils } from "zksync-ethers";
import { BlockchainService, TransactionTrace } from "../blockchain/blockchain.service";
import { TokenService, Token, TokenType } from "../token/token.service";
import {
  L2_PROTOCOL_UPGRADES_CALLER_ADDRESS,
  L2_CONTRACT_DEPLOYER_ADDRESS,
  CONTRACT_INTERFACES,
  BASE_TOKEN_ADDRESS,
} from "../constants";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { TransferType } from "../transfer/transfer.service";

const baseTokenInterface = CONTRACT_INTERFACES.L2_BASE_TOKEN.interface;
const baseTokenTransferFn = baseTokenInterface.getFunction("transferFromTo");

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
  baseTokenTransfers: Transfer[];
  transfersWithValue: Transfer[];
  error?: string;
  revertReason?: string;
}

function getTransactionTraceData(
  transactionReceipt: types.TransactionReceipt,
  transactionDetails: types.TransactionDetails,
  transactionTrace: TransactionTrace,
  extractedData: ExtractedTraceData = undefined
): ExtractedTraceData {
  if (!extractedData) {
    extractedData = {
      contractAddresses: [],
      baseTokenTransfers: [],
      transfersWithValue: [],
      error: transactionTrace?.error,
      revertReason: transactionTrace?.revertReason,
    };
  }

  if (transactionTrace) {
    const traceType = transactionTrace.type.toLowerCase();
    if (["create", "create2"].includes(traceType)) {
      extractedData.contractAddresses.push({
        address: transactionTrace.to,
        blockNumber: transactionReceipt.blockNumber,
        transactionHash: transactionReceipt.hash,
        creatorAddress: transactionReceipt.from,
        logIndex: extractedData.contractAddresses.length + 1,
      });
    }

    // Calls to the L2BaseToken contract which is an entry point for the base token transfers
    // Used instead of the Transfer events. Relevant for ZK chains.
    if (
      transactionTrace.to === BASE_TOKEN_ADDRESS &&
      transactionTrace.error == null &&
      transactionTrace.input.startsWith(baseTokenTransferFn.selector)
    ) {
      const decodedData = baseTokenInterface.decodeFunctionData(baseTokenTransferFn, transactionTrace.input);
      const transferType =
        decodedData._to === utils.BOOTLOADER_FORMAL_ADDRESS
          ? TransferType.Fee
          : decodedData._from === utils.BOOTLOADER_FORMAL_ADDRESS
          ? TransferType.Refund
          : TransferType.Transfer;

      extractedData.baseTokenTransfers.push({
        from: decodedData._from.toLowerCase(),
        to: decodedData._to.toLowerCase(),
        transactionHash: transactionReceipt.hash,
        blockNumber: transactionReceipt.blockNumber,
        amount: BigInt(decodedData._amount),
        tokenAddress: BASE_TOKEN_ADDRESS,
        type: transferType,
        tokenType: TokenType.BaseToken,
        isFeeOrRefund: [TransferType.Fee, TransferType.Refund].includes(transferType),
        logIndex: extractedData.baseTokenTransfers.length + 1,
        transactionIndex: transactionReceipt.index,
        timestamp: transactionDetails.receivedAt,
      });
    }

    // EVM-like way to extract base token transfers. Relevant for ZK OS.
    // DELEGATECALL and STATICCALL cannot transfer ETH.
    if (transactionTrace.value !== "0x0" && !["delegatecall", "staticcall"].includes(traceType)) {
      extractedData.transfersWithValue.push({
        from: transactionTrace.from.toLowerCase(),
        to: transactionTrace.to.toLowerCase(),
        transactionHash: transactionReceipt.hash,
        blockNumber: transactionReceipt.blockNumber,
        amount: BigInt(transactionTrace.value),
        tokenAddress: BASE_TOKEN_ADDRESS,
        type: TransferType.Transfer,
        tokenType: TokenType.BaseToken,
        isFeeOrRefund: false,
        logIndex: extractedData.transfersWithValue.length + 1,
        transactionIndex: transactionReceipt.index,
        timestamp: transactionDetails.receivedAt,
      });
    }

    transactionTrace.calls.forEach((subCall) => {
      getTransactionTraceData(transactionReceipt, transactionDetails, subCall, extractedData);
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
    transaction: types.TransactionResponse,
    transactionReceipt: types.TransactionReceipt,
    transactionDetails: types.TransactionDetails
  ): Promise<TransactionTraceData> {
    this.logger.debug({
      message: "Fetching traces and extracting trace data",
      blockNumber: transactionReceipt.blockNumber,
      transactionHash: transactionReceipt.hash,
    });
    const traces = await this.blockchainService.debugTraceTransaction(transactionReceipt.hash, false);
    const extractedTraceData = getTransactionTraceData(transactionReceipt, transactionDetails, traces);
    const transactionTraceData: TransactionTraceData = {
      contractAddresses: extractedTraceData.contractAddresses,
      error: extractedTraceData.error,
      revertReason: extractedTraceData.revertReason,
      transfers:
        extractedTraceData.baseTokenTransfers.length > 0
          ? // ZK chains transfers
            extractedTraceData.baseTokenTransfers
          : // ZK OS transfers
            extractedTraceData.transfersWithValue,
      tokens: [],
    };

    // Extract upgraded contract addresses from the protocol upgrade transaction. Add them to the trace data so they can be
    // processed later like any other contract address.
    //
    // System contracts upgrades don't have `create` traces and are performed via a call to the ContractDeployer's
    //  `forceDeployOnAddresses` function.' The caller is always 0x0000000000000000000000000000000000008007.
    if (
      transactionReceipt.from === L2_PROTOCOL_UPGRADES_CALLER_ADDRESS &&
      transactionReceipt.to === L2_CONTRACT_DEPLOYER_ADDRESS
    ) {
      const parsedTx = CONTRACT_INTERFACES.L2_CONTRACT_DEPLOYER.interface.parseTransaction(transaction);
      parsedTx.args._deployments.forEach((deployment) => {
        transactionTraceData.contractAddresses.push({
          address: deployment.newAddress,
          blockNumber: transactionReceipt.blockNumber,
          transactionHash: transactionReceipt.hash,
          creatorAddress: transactionReceipt.from,
          logIndex: transactionTraceData.contractAddresses.length + 1,
        });
      });
    }

    this.logger.debug({
      message: "Requesting contracts' bytecode and bytecode hashes",
      transactionReceipt: transactionReceipt.blockNumber,
    });
    transactionTraceData.contractAddresses = (
      await Promise.all(
        transactionTraceData.contractAddresses.map(async (contractAddress) => {
          const [bytecode, bytecodeHash] = await Promise.all([
            this.blockchainService.getCode(contractAddress.address),
            this.blockchainService.getRawCodeHash(contractAddress.address),
          ]);
          contractAddress.bytecode = bytecode;
          // If it's 0x02, it's an EVM contract. Otherwise, it's an EraVM contract.
          contractAddress.isEvmLike = bytecodeHash?.startsWith("0x02");
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
      blockNumber: transactionReceipt.blockNumber,
      transactionHash: transactionReceipt.hash,
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
