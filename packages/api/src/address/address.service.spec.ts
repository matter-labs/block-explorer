import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { AddressService } from "./address.service";
import { Address } from "./address.entity";

describe("AddressService", () => {
  let addressRecord;
  let service: AddressService;
  let repositoryMock: Repository<Address>;
  const blockchainAddress = "blockchainAddress";

  beforeEach(async () => {
    repositoryMock = mock<Repository<Address>>();

    addressRecord = {
      address: blockchainAddress,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        {
          provide: getRepositoryToken(Address),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("findOne", () => {
    beforeEach(() => {
      (repositoryMock.findOneBy as jest.Mock).mockResolvedValue(addressRecord);
    });

    it("queries addresses by specified address", async () => {
      await service.findOne(blockchainAddress);
      expect(repositoryMock.findOneBy).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ address: blockchainAddress });
    });

    it("returns addressRecord by address", async () => {
      const result = await service.findOne(blockchainAddress);
      expect(result).toBe(addressRecord);
    });
  });

  describe("findByAddresses", () => {
    beforeEach(() => {
      (repositoryMock.find as jest.Mock).mockResolvedValue([addressRecord]);
    });

    it("queries addresses by specified addresses list", async () => {
      await service.findByAddresses([blockchainAddress]);
      expect(repositoryMock.find).toHaveBeenCalledTimes(1);
      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: {
          address: In([blockchainAddress]),
        },
      });
    });

    it("returns address records", async () => {
      const result = await service.findByAddresses([blockchainAddress]);
      expect(result).toEqual([addressRecord]);
    });
  });
});
