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
    const existingContracts = await this.addressRepository.find({
      where: {
        address: In(systemContracts.map((contract) => contract.address)),
      },
      select: {
        address: true,
      },
    });

    for (const contract of systemContracts) {
      if (!existingContracts.find((existingContract) => existingContract.address === contract.address)) {
        const bytecode = await this.blockchainService.getCode(contract.address);
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
    // name field is never used, it's just for better readability & understanding
    return [
      {
        address: "0x0000000000000000000000000000000000000000",
        name: "EmptyContract",
      },
      {
        address: "0x0000000000000000000000000000000000000001",
        name: "Ecrecover",
      },
      {
        address: "0x0000000000000000000000000000000000000002",
        name: "SHA256",
      },
      {
        address: "0x0000000000000000000000000000000000000006",
        name: "EcAdd",
      },
      {
        address: "0x0000000000000000000000000000000000000007",
        name: "EcMul",
      },
      {
        address: "0x0000000000000000000000000000000000000008",
        name: "EcPairing",
      },
      {
        address: "0x0000000000000000000000000000000000008001",
        name: "EmptyContract",
      },
      {
        address: "0x0000000000000000000000000000000000008002",
        name: "AccountCodeStorage",
      },
      {
        address: "0x0000000000000000000000000000000000008003",
        name: "NonceHolder",
      },
      {
        address: "0x0000000000000000000000000000000000008004",
        name: "KnownCodesStorage",
      },
      {
        address: "0x0000000000000000000000000000000000008005",
        name: "ImmutableSimulator",
      },
      {
        address: "0x0000000000000000000000000000000000008006",
        name: "ContractDeployer",
      },
      {
        address: "0x0000000000000000000000000000000000008008",
        name: "L1Messenger",
      },
      {
        address: "0x0000000000000000000000000000000000008009",
        name: "MsgValueSimulator",
      },
      {
        address: "0x000000000000000000000000000000000000800a",
        name: "L2BaseToken",
      },
      {
        address: "0x000000000000000000000000000000000000800b",
        name: "SystemContext",
      },
      {
        address: "0x000000000000000000000000000000000000800c",
        name: "BootloaderUtilities",
      },
      {
        address: "0x000000000000000000000000000000000000800d",
        name: "EventWriter",
      },
      {
        address: "0x000000000000000000000000000000000000800e",
        name: "Compressor",
      },
      {
        address: "0x000000000000000000000000000000000000800f",
        name: "ComplexUpgrader",
      },
      {
        address: "0x0000000000000000000000000000000000008010",
        name: "Keccak256",
      },
      {
        address: "0x0000000000000000000000000000000000008012",
        name: "CodeOracle",
      },
      {
        address: "0x0000000000000000000000000000000000000100",
        name: "P256Verify",
      },
      {
        address: "0x0000000000000000000000000000000000008011",
        name: "PubdataChunkPublisher",
      },
      {
        address: "0x0000000000000000000000000000000000010000",
        name: "Create2Factory",
      },
    ];
  }
}
