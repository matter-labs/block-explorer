import { types } from "zksync-ethers";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { TransferType } from "../transfer/transfer.service";
import { BASE_TOKEN_ADDRESS } from "../constants";

export default function isInternalTransaction(transfer: Transfer, transactionReceipt?: types.TransactionReceipt) {
  if (transfer.type !== TransferType.Transfer) {
    return false;
  }
  if (transfer.tokenAddress.toLowerCase() !== BASE_TOKEN_ADDRESS.toLowerCase()) {
    return false;
  }
  if (
    transactionReceipt?.from.toLowerCase() === transfer.from.toLowerCase() &&
    transactionReceipt.to.toLowerCase() === transfer.to.toLowerCase()
  ) {
    return false;
  }
  return true;
}
