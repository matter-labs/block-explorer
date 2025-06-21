import { Injectable, Logger } from "@nestjs/common";
import { types } from "zksync-ethers";
import { BlockchainService, TransactionTrace } from "../blockchain/blockchain.service";
import { TokenService, Token } from "../token/token.service";

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
  error?: string;
  revertReason?: string;
  tokens?: Token[];
}

function getTransactionTraceData(
  transactionReceipt: types.TransactionReceipt,
  transactionTrace: TransactionTrace,
  extractedData: TransactionTraceData = undefined
): TransactionTraceData {
  if (!extractedData) {
    extractedData = {
      contractAddresses: [],
      error: transactionTrace?.error,
      revertReason: transactionTrace?.revertReason,
    };
  }

  if (transactionTrace.type === "create") {
    extractedData.contractAddresses.push({
      address: transactionTrace.to,
      blockNumber: transactionReceipt.blockNumber,
      transactionHash: transactionReceipt.hash,
      creatorAddress: transactionReceipt.from,
      logIndex: extractedData.contractAddresses.length + 1,
    });
  }

  transactionTrace.calls.forEach((subCall) => {
    getTransactionTraceData(transactionReceipt, subCall, extractedData);
  });

  return extractedData;
}

@Injectable()
export class TransactionTracesService {
  private readonly logger: Logger;

  constructor(private readonly blockchainService: BlockchainService, private readonly tokenService: TokenService) {
    this.logger = new Logger(TransactionTracesService.name);
  }

  public async getData(transactionReceipt: types.TransactionReceipt): Promise<TransactionTraceData> {
    this.logger.debug({
      message: "Fetching traces and extracting trace data",
      blockNumber: transactionReceipt.blockNumber,
      transactionHash: transactionReceipt.hash,
    });
    const traces = await this.blockchainService.debugTraceTransaction(transactionReceipt.hash, false);
    const transactionTraceData = getTransactionTraceData(transactionReceipt, traces);

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
          contractAddress.isEvmLike = bytecodeHash.startsWith("0x02");
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
