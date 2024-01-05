import { BigNumber } from "ethers";
import { TransferType } from "../transfer.service";
import { TokenType } from "../../token/token.service";

export interface TransferFields {
  tokenId?: BigNumber;
}

export interface Transfer {
  from: string;
  to: string;
  transactionHash: string;
  transactionIndex: number;
  timestamp: Date;
  blockNumber: number;
  amount: BigNumber;
  tokenAddress: string;
  type: TransferType;
  tokenType: TokenType;
  isFeeOrRefund: boolean;
  logIndex: number;
  fields?: TransferFields;
  isInternal?: boolean;
}
