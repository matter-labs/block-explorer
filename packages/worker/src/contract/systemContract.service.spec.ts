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
  const genesisContracts = [
    {
      address: "0x000000000000000000000000000000000000800f",
      code: "0x000000000000000000000000000000000000800f-code",
    },
    {
      address: "0x0000000000000000000000000000000000010001",
      code: "0x0000000000000000000000000000000000010001-code",
    },
  ];

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>({
      getGenesisContracts: jest.fn().mockResolvedValue(genesisContracts),
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
        SystemContractService.getSystemContracts()
          .map((contract) => mock<Address>({ address: contract.address }))
          .concat(genesisContracts.map((c) => mock<Address>({ address: c.address })))
      );
      await systemContractService.addSystemContracts();
      expect(addressRepositoryMock.upsert).toBeCalledTimes(0);
    });

    it("adds all system contracts if none of them exist in the DB", async () => {
      (addressRepositoryMock.find as jest.Mock).mockResolvedValue([]);
      await systemContractService.addSystemContracts();
      expect(addressRepositoryMock.upsert).toBeCalledTimes(genesisContracts.length + systemContracts.length);
      for (const systemContract of systemContracts) {
        expect(addressRepositoryMock.upsert).toBeCalledWith({
          address: systemContract.address,
          bytecode: `${systemContract.address}-code`,
        });
      }
      for (const genesisContract of genesisContracts) {
        expect(addressRepositoryMock.upsert).toBeCalledWith({
          address: genesisContract.address,
          bytecode: genesisContract.code,
        });
      }
    });

    it("adds only missing genesis contracts", async () => {
      const existingContractAddresses = [genesisContracts[0].address];
      (addressRepositoryMock.find as jest.Mock).mockResolvedValue(
        existingContractAddresses.map((existingContractAddress) => mock<Address>({ address: existingContractAddress }))
      );
      await systemContractService.addSystemContracts();
      expect(addressRepositoryMock.upsert).toBeCalledTimes(
        genesisContracts.length + systemContracts.length - existingContractAddresses.length
      );
      for (const systemContract of systemContracts) {
        if (!existingContractAddresses.includes(systemContract.address)) {
          expect(addressRepositoryMock.upsert).toBeCalledWith({
            address: systemContract.address,
            bytecode: `${systemContract.address}-code`,
          });
        }
      }
    });
  });
});
