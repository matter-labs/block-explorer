import { mock } from "jest-mock-extended";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { BlockchainService } from "../blockchain/blockchain.service";
import { AddressRepository } from "../repositories/address.repository";
import { SystemContractService } from "./systemContract.service";
import { Address } from "../entities";

describe("SystemContractService", () => {
  let systemContractService: SystemContractService;
  let blockchainServiceMock: BlockchainService;
  let addressRepositoryMock: AddressRepository;
  const systemContracts = SystemContractService.getSystemContracts();

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>({
      getCode: jest.fn().mockImplementation((address: string) => Promise.resolve(`${address}-code`)),
    });

    addressRepositoryMock = mock<AddressRepository>({
      find: jest.fn(),
    });

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        SystemContractService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: AddressRepository,
          useValue: addressRepositoryMock,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());
    systemContractService = app.get<SystemContractService>(SystemContractService);
  });

  describe("addSystemContracts", () => {
    it("doesn't add any system contracts if they already exist in DB", async () => {
      (addressRepositoryMock.find as jest.Mock).mockResolvedValue(
        SystemContractService.getSystemContracts().map((contract) => mock<Address>({ address: contract.address }))
      );
      await systemContractService.addSystemContracts();
      expect(addressRepositoryMock.upsert).toBeCalledTimes(0);
    });

    it("adds all system contracts if none of them exist in the DB", async () => {
      (addressRepositoryMock.find as jest.Mock).mockResolvedValue([]);
      await systemContractService.addSystemContracts();
      expect(addressRepositoryMock.upsert).toBeCalledTimes(systemContracts.length);
      for (const systemContract of systemContracts) {
        expect(addressRepositoryMock.upsert).toBeCalledWith({
          address: systemContract.address,
          bytecode: `${systemContract.address}-code`,
        });
      }
    });

    it("adds only missing system contracts", async () => {
      const existingContractAddresses = [
        "0x000000000000000000000000000000000000800d",
        "0x0000000000000000000000000000000000008006",
      ];
      (addressRepositoryMock.find as jest.Mock).mockResolvedValue(
        existingContractAddresses.map((existingContractAddress) => mock<Address>({ address: existingContractAddress }))
      );
      await systemContractService.addSystemContracts();
      expect(addressRepositoryMock.upsert).toBeCalledTimes(systemContracts.length - existingContractAddresses.length);
      for (const systemContract of systemContracts) {
        if (!existingContractAddresses.includes(systemContract.address)) {
          expect(addressRepositoryMock.upsert).toBeCalledWith({
            address: systemContract.address,
            bytecode: `${systemContract.address}-code`,
          });
        }
      }
    });

    it("adds contracts only if they are deployed to the network", async () => {
      const notDeployedSystemContracts = [
        "0x000000000000000000000000000000000000800d",
        "0x0000000000000000000000000000000000008006",
      ];
      (addressRepositoryMock.find as jest.Mock).mockResolvedValue([]);
      (blockchainServiceMock.getCode as jest.Mock).mockImplementation(async (address: string) => {
        if (notDeployedSystemContracts.includes(address)) {
          return "0x";
        }
        return `${address}-code`;
      });
      await systemContractService.addSystemContracts();
      expect(addressRepositoryMock.upsert).toBeCalledTimes(systemContracts.length - notDeployedSystemContracts.length);
      for (const systemContract of systemContracts) {
        if (!notDeployedSystemContracts.includes(systemContract.address)) {
          expect(addressRepositoryMock.upsert).toBeCalledWith({
            address: systemContract.address,
            bytecode: `${systemContract.address}-code`,
          });
        }
      }
    });
  });
});
