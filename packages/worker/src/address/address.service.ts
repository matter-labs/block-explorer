import { Injectable, Logger } from "@nestjs/common";
import { BigNumber } from "ethers";
import { types } from "zksync-web3";
import { BlockchainService } from "../blockchain/blockchain.service";
import { AddressRepository } from "../repositories";
import { LogType } from "../log/logType";
import { ExtractContractAddressHandler } from "./interface/extractContractAddressHandler.interface";
import { defaultContractDeployedHandler } from "./extractContractDeployedHandlers";
import { ContractAddress } from "./interface/contractAddress.interface";

const extractContractAddressesHandlers: Record<string, ExtractContractAddressHandler[]> = {
  [LogType.ContractDeployed]: [defaultContractDeployedHandler],
};

@Injectable()
export class AddressService {
  private readonly logger: Logger;
  public changedBalances: Map<string, Map<string, BigNumber>>;

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly addressRepository: AddressRepository
  ) {
    this.logger = new Logger(AddressService.name);
  }

  private async saveContractAddress(contractAddress: ContractAddress): Promise<void> {
    const bytecode = await this.blockchainService.getCode(contractAddress.address);

    const addressDto = {
      address: contractAddress.address,
      bytecode,
      createdInBlockNumber: contractAddress.blockNumber,
      creatorTxHash: contractAddress.transactionHash,
      creatorAddress: contractAddress.creatorAddress,
      createdInLogIndex: contractAddress.logIndex,
    };

    await this.addressRepository.upsert(addressDto);
  }

  public async saveContractAddresses(
    logs: types.Log[],
    transactionReceipt: types.TransactionReceipt
  ): Promise<ContractAddress[]> {
    const contractAddresses: ContractAddress[] = [];
    if (!logs) {
      return contractAddresses;
    }

    for (const log of logs) {
      const handlerForLog = extractContractAddressesHandlers[log.topics[0]]?.find((handler) => handler.matches(log));

      if (!handlerForLog) {
        continue;
      }

      const contractAddress = handlerForLog.extract(log, transactionReceipt);
      if (contractAddress) {
        contractAddresses.push(contractAddress);
      }
    }

    this.logger.debug({ message: "Saving contract addresses.", transactionReceipt: transactionReceipt.blockNumber });
    await Promise.all(contractAddresses.map((contractAddress) => this.saveContractAddress(contractAddress)));

    return contractAddresses;
  }
}
