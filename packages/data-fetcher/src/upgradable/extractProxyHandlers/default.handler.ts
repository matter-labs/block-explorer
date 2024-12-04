import { types } from "zksync-ethers";
import { AbiCoder, keccak256 } from "ethers";
import { ExtractProxyAddressHandler } from "../interface/extractProxyHandler.interface";
import { ProxyAddress } from "../interface/proxyAddress.interface";

const abiCoder: AbiCoder = AbiCoder.defaultAbiCoder();

export const encodedUpgradableEvents = [
  "Upgraded(address)",
  "BeaconUpgraded(address)",
  "OwnershipTransferred(address,address)",
  "AdminChanged(address,address)",
  "OwnershipTransferred(address,address)",
];

const decodedUpgradableEvents = encodedUpgradableEvents.map((event) => `${keccak256(Buffer.from(event)).toString()}`);

export const defaultContractUpgradableHandler: ExtractProxyAddressHandler = {
  matches: (log: types.Log): boolean => {
    return decodedUpgradableEvents.includes(log.topics[0]);
  },
  extract: (log: types.Log, txReceipt: types.TransactionReceipt): ProxyAddress => {
    if (!log.topics[1]) {
      return null;
    }

    const [address] = abiCoder.decode(["address"], log.topics[1]);
    return {
      address: log.address,
      blockNumber: txReceipt.blockNumber,
      transactionHash: txReceipt.hash,
      creatorAddress: txReceipt.from,
      logIndex: log.index,
      implementationAddress: address,
    };
  },
};
