import { Injectable } from "@nestjs/common";
import { BlockchainService } from "../blockchain/blockchain.service";
import { AddressRepository } from "../repositories";
import { In } from "typeorm";

@Injectable()
export class SystemContractService {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly blockchainService: BlockchainService
  ) {}

  public async addSystemContracts(): Promise<void> {
    const systemContracts = SystemContractService.getSystemContracts();
    const genesisContracts = await this.blockchainService.getGenesisContracts();
    const allSystemContracts = genesisContracts.concat(
      systemContracts.map((c) => ({ address: c.address, code: null }))
    );
    const existingContracts = await this.addressRepository.find({
      where: {
        address: In(allSystemContracts.map((contract) => contract.address)),
      },
      select: {
        address: true,
      },
    });

    for (const contract of allSystemContracts) {
      if (!existingContracts.find((existingContract) => existingContract.address === contract.address)) {
        const bytecode = contract.code || (await this.blockchainService.getCode(contract.address));
        // some contract might not exist on the environment yet
        if (bytecode !== "0x") {
          await this.addressRepository.upsert({
            address: contract.address,
            bytecode,
          });
        }
      }
    }
  }

  public static getSystemContracts() {
    // There are no system contracts in ZKsync OS
    return [];
  }
}
