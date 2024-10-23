import { types } from "zksync-ethers";
import { TokenType } from "../entities/token.entity";
import { TransferType } from "../entities/transfer.entity";

type Modify<T, R> = Omit<T, keyof R> & R;

export interface Balance {
  address: string;
  tokenAddress: string;
  blockNumber: number;
  balance: string;
  tokenType: TokenType;
}

export interface TransferFields {
  tokenId?: string;
}

export interface Transfer {
  from: string;
  to: string;
  transactionHash: string;
  transactionIndex: number;
  timestamp: string;
  blockNumber: number;
  amount: string;
  tokenAddress: string;
  type: TransferType;
  tokenType: TokenType;
  isFeeOrRefund: boolean;
  logIndex: number;
  fields?: TransferFields;
  isInternal: boolean;
}

export interface Token {
  l2Address: string;
  l1Address?: string;
  symbol: string;
  decimals: number;
  name: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

export interface ContractAddress {
  address: string;
  blockNumber: number;
  transactionHash: string;
  creatorAddress: string;
  logIndex: number;
  bytecode?: string;
}

export interface LogsData {
  transfers: Transfer[];
  contractAddresses: ContractAddress[];
  tokens: Token[];
}

export interface TransactionInfo
  extends Modify<
    types.TransactionResponse,
    {
      gasPrice: string;
      maxPriorityFeePerGas: string;
      maxFeePerGas: string;
      gasLimit: string;
      value: string;
    }
  > {
  // TransactionDetails fields
  fee: string;
  receiptStatus: number;
  isL1Originated: boolean;
  receivedAt: string;
  error?: string;
  revertReason?: string;
}

export type TransactionReceipt = Modify<
  types.TransactionReceipt,
  {
    gasUsed: string;
    cumulativeGasUsed: string;
    gasPrice: string;
  }
>;

export interface TransactionData extends LogsData {
  transaction: TransactionInfo;
  transactionReceipt: TransactionReceipt;
}

export type Block = Modify<
  types.Block,
  {
    gasLimit: string;
    gasUsed: string;
    baseFeePerGas: string;
  }
>;

export interface BlockData {
  block: Block;
  blockDetails: types.BlockDetails;
  transactions: TransactionData[];
  blockLogs: types.Log[];
  blockTransfers: Transfer[];
  changedBalances: Balance[];
}
