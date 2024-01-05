import { types } from "zksync-web3";
import { ExtractContractAddressHandler } from "../interface/extractContractAddressHandler.interface";
import { utils as ethersUtils } from "ethers";
import { ContractAddress } from "../interface/contractAddress.interface";

const abiCoder: ethersUtils.AbiCoder = new ethersUtils.AbiCoder();

export const defaultContractDeployedHandler: ExtractContractAddressHandler = {
  matches: (): boolean => true,
  extract: (log: types.Log, txReceipt: types.TransactionReceipt): ContractAddress => {
    const [address] = abiCoder.decode(["address"], log.topics[3]);

    return {
      address,
      blockNumber: txReceipt.blockNumber,
      transactionHash: txReceipt.transactionHash,
      creatorAddress: txReceipt.from,
      logIndex: log.logIndex,
    };
  },
};
