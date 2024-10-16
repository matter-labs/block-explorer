import { types } from "zksync-ethers";
import { ExtractContractAddressHandler } from "../interface/extractContractAddressHandler.interface";
import { AbiCoder } from "ethers";
import { ContractAddress } from "../interface/contractAddress.interface";

const abiCoder: AbiCoder = AbiCoder.defaultAbiCoder();

export const defaultContractDeployedHandler: ExtractContractAddressHandler = {
  matches: (): boolean => true,
  extract: (log: types.Log, txReceipt: types.TransactionReceipt): ContractAddress => {
    const [address] = abiCoder.decode(["address"], log.topics[3]);

    return {
      address,
      blockNumber: txReceipt.blockNumber,
      transactionHash: txReceipt.hash,
      creatorAddress: txReceipt.from,
      logIndex: log.index,
    };
  },
};
