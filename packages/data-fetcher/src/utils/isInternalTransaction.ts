import { types, utils } from "zksync-web3";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { TransferType } from "../transfer/transfer.service";

export default function isInternalTransaction(transfer: Transfer, transactionReceipt?: types.TransactionReceipt) {
  if (transfer.type !== TransferType.Transfer) {
    return false;
  }
  if (transfer.tokenAddress.toLowerCase() !== utils.L2_ETH_TOKEN_ADDRESS.toLowerCase()) {
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
