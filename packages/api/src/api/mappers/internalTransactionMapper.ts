import { InternalTransaction } from "../../transaction/entities/internalTransaction.entity";

export const mapInternalTransactionListItem = (internalTx: InternalTransaction) => ({
  blockNumber: internalTx.blockNumber.toString(),
  timeStamp: Math.floor(new Date(internalTx.timestamp).getTime() / 1000).toString(),
  hash: internalTx.transactionHash,
  from: internalTx.from,
  to: internalTx.to || "",
  value: internalTx.value,
  gas: internalTx.gas?.toString() || "",
  input: internalTx.input || "",
  type: internalTx.callType || internalTx.type.toLowerCase(),
  contractAddress:
    internalTx.type.toUpperCase() === "CREATE" || internalTx.type.toUpperCase() === "CREATE2"
      ? internalTx.to
      : undefined,
  gasUsed: internalTx.gasUsed?.toString() || "",
  fee: internalTx.transaction?.fee ? BigInt(internalTx.transaction.fee).toString() : undefined,
  traceId: internalTx.traceAddress,
  transactionType: internalTx.transaction?.type.toString(),
  isError: internalTx.error ? "1" : "0",
  errCode: internalTx.error || "",
});
