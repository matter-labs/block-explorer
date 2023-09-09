import { BigNumber } from "ethers";
import { TransferType } from "../../entities/transfer.entity";

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
  isFeeOrRefund: boolean;
  logIndex: number;
  fields?: TransferFields;
  isInternal?: boolean;
}
