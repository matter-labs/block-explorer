import { TransferType } from "../transfer.service";
import { TokenType } from "../../token/token.service";

export interface TransferFields {
  tokenId?: bigint;
}

export interface Transfer {
  from: string;
  to: string;
  transactionHash: string;
  blockNumber: number;
  amount: bigint;
  tokenAddress: string;
  type: TransferType;
  tokenType: TokenType;
  isFeeOrRefund: boolean;
  logIndex: number;
  transactionIndex: number;
  timestamp: Date;
  fields?: TransferFields;
  isInternal?: boolean;
}
