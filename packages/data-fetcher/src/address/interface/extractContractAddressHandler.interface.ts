import { types } from "zksync-web3";
import { ContractAddress } from "./contractAddress.interface";

export interface ExtractContractAddressHandler {
  matches: (log: types.Log) => boolean;
  extract: (log: types.Log, txReceipt: types.TransactionReceipt) => ContractAddress | null;
}
