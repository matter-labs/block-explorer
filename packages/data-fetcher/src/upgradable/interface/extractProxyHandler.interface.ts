import { types } from "zksync-ethers";
import { ProxyAddress } from "./proxyAddress.interface";

export interface ExtractProxyAddressHandler {
  matches: (log: types.Log) => boolean;
  extract: (log: types.Log, txReceipt: types.TransactionReceipt) => ProxyAddress | null;
}
