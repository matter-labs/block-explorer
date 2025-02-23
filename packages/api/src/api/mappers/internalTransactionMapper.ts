import { Transfer } from "../../transfer/transfer.entity";
import { TransactionStatus } from "../../transaction/entities/transaction.entity";

export const mapInternalTransactionListItem = (transfer: Transfer) => ({
  blockNumber: transfer.blockNumber.toString(),
  timeStamp: Math.floor(new Date(transfer.timestamp).getTime() / 1000).toString(),
  hash: transfer.transactionHash,
  from: transfer.from,
  to: transfer.to,
  value: transfer.amount,
  gas: transfer.transaction?.gasLimit,
  input: "",
  type: "call",
  contractAddress: transfer.transaction?.transactionReceipt.contractAddress,
  gasUsed: transfer.transaction?.transactionReceipt.gasUsed,
  fee: transfer.transaction?.fee ? BigInt(transfer.transaction.fee).toString() : undefined,
  l1BatchNumber: transfer.transaction?.l1BatchNumber.toString(),
  traceId: "0",
  transactionType: transfer.transaction?.type.toString(),
  isError: transfer.transaction?.status === TransactionStatus.Failed ? "1" : "0",
  errCode: "",
});
