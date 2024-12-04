import { getMethodId } from "../../common/utils";
import { AddressTransaction } from "../../transaction/entities/addressTransaction.entity";
import { TransactionStatus } from "../../transaction/entities/transaction.entity";
import { dateToTimestamp } from "../../common/utils";

export const mapTransactionListItem = (addressTransaction: AddressTransaction, lastBlockNumber: number) => ({
  blockNumber: addressTransaction.transaction.blockNumber.toString(),
  timeStamp: dateToTimestamp(addressTransaction.transaction.receivedAt).toString(),
  hash: addressTransaction.transaction.hash,
  nonce: addressTransaction.transaction.nonce.toString(),
  blockHash: addressTransaction.transaction.blockHash,
  transactionIndex: addressTransaction.transaction.transactionIndex.toString(),
  from: addressTransaction.transaction.from,
  to: addressTransaction.transaction.to,
  value: addressTransaction.transaction.value,
  gas: addressTransaction.transaction.gasLimit,
  gasPrice: addressTransaction.transaction.gasPrice,
  isError: addressTransaction.transaction.status === TransactionStatus.Failed ? "1" : "0",
  txreceipt_status: addressTransaction.transaction.receiptStatus.toString(),
  input: addressTransaction.transaction.data,
  contractAddress: addressTransaction.transaction.transactionReceipt.contractAddress,
  cumulativeGasUsed: addressTransaction.transaction.transactionReceipt.cumulativeGasUsed,
  gasUsed: addressTransaction.transaction.transactionReceipt.gasUsed,
  confirmations: (lastBlockNumber - addressTransaction.transaction.blockNumber).toString(),
  fee: BigInt(addressTransaction.transaction.fee).toString(),
  commitTxHash: addressTransaction.transaction.commitTxHash,
  proveTxHash: addressTransaction.transaction.proveTxHash,
  executeTxHash: addressTransaction.transaction.executeTxHash,
  isL1Originated: addressTransaction.transaction.isL1Originated ? "1" : "0",
  l1BatchNumber: addressTransaction.transaction.l1BatchNumber.toString(),
  type: addressTransaction.transaction.type.toString(),
  methodId: getMethodId(addressTransaction.transaction.data),
  functionName: "",
});
