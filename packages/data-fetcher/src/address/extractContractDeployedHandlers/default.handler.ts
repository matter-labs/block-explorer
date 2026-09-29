import { types, utils } from "zksync-ethers";
import { ExtractContractAddressHandler } from "../interface/extractContractAddressHandler.interface";
import { AbiCoder } from "ethers";
import { ContractAddress } from "../interface/contractAddress.interface";

const abiCoder: AbiCoder = AbiCoder.defaultAbiCoder();

export const defaultContractDeployedHandler: ExtractContractAddressHandler = {
  // any contract can emit a log of the same shape, only logs of the ContractDeployer are genuine deployments
  matches: (log: types.Log): boolean => log.address.toLowerCase() === utils.CONTRACT_DEPLOYER_ADDRESS,
  extract: (log: types.Log, txReceipt: types.TransactionReceipt): ContractAddress => {
    const [address] = abiCoder.decode(["address"], log.topics[3]);
    const [bytecodeHash] = abiCoder.decode(["bytes32"], log.topics[2]);
    // bytecodeHash is a 32-byte (64 character) hex string
    // The highest byte is the first two characters after 0x
    // If it's 0x02, it's an EVM contract
    // If it's 0x01, it's a EraVM contract
    const highestByte = `0x${bytecodeHash.slice(2, 4)}`;
    const isEvmLike = highestByte === "0x02";
    const [deployerAddress] = abiCoder.decode(["address"], log.topics[1]);
    return {
      address,
      blockNumber: txReceipt.blockNumber,
      transactionHash: txReceipt.hash,
      creatorAddress: txReceipt.from,
      deployerAddress,
      logIndex: log.index,
      isEvmLike,
    };
  },
};
