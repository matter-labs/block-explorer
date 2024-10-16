import { Injectable, Logger } from "@nestjs/common";
import { types } from "zksync-ethers";
import { BlockchainService } from "../blockchain/blockchain.service";
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
  public changedBalances: Map<string, Map<string, bigint>>;

  constructor(private readonly blockchainService: BlockchainService) {
    this.logger = new Logger(AddressService.name);
  }

  public async getContractAddresses(
    logs: ReadonlyArray<types.Log>,
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

    this.logger.debug({
      message: "Requesting contracts' bytecode",
      transactionReceipt: transactionReceipt.blockNumber,
    });
    await Promise.all(
      contractAddresses.map(async (contractAddress) => {
        contractAddress.bytecode = await this.blockchainService.getCode(contractAddress.address);
      })
    );

    return contractAddresses;
  }
}
