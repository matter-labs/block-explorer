import { getMethodId } from "../../common/utils";
import { Transaction, TransactionStatus } from "../../transaction/entities/transaction.entity";
import { dateToTimestamp } from "../../common/utils";

export const mapTransactionListItem = (transaction: Transaction, lastBlockNumber: number) => ({
  blockNumber: transaction.blockNumber.toString(),
  timeStamp: dateToTimestamp(transaction.receivedAt).toString(),
  hash: transaction.hash,
  nonce: transaction.nonce.toString(),
  blockHash: transaction.blockHash,
  transactionIndex: transaction.transactionIndex.toString(),
  from: transaction.from,
  to: transaction.to,
  value: transaction.value,
  gas: transaction.gasLimit,
  gasPrice: transaction.gasPrice,
  isError: transaction.status === TransactionStatus.Failed ? "1" : "0",
  txreceipt_status: transaction.receiptStatus.toString(),
  input: transaction.data,
  contractAddress: transaction.transactionReceipt.contractAddress,
  cumulativeGasUsed: transaction.transactionReceipt.cumulativeGasUsed,
  gasUsed: transaction.transactionReceipt.gasUsed,
  confirmations: (lastBlockNumber - transaction.blockNumber).toString(),
  fee: BigInt(transaction.fee).toString(),
  isL1Originated: transaction.isL1Originated ? "1" : "0",
  type: transaction.type.toString(),
  methodId: getMethodId(transaction.data),
  functionName: "",
});
