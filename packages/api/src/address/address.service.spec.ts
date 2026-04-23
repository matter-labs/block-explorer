import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { AddressService } from "./address.service";
import { Address } from "./address.entity";
import { IndexerStateService } from "../indexerState/indexerState.service";

describe("AddressService", () => {
  let addressRecord;
  let service: AddressService;
  let repositoryMock: Repository<Address>;
  let queryBuilderMock: SelectQueryBuilder<Address>;
  const blockchainAddress = "blockchainAddress";
  const lastReadyBlockNumber = 1_000_000;

  beforeEach(async () => {
    repositoryMock = mock<Repository<Address>>();
    queryBuilderMock = mock<SelectQueryBuilder<Address>>();
    (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
    (queryBuilderMock.where as jest.Mock).mockReturnValue(queryBuilderMock);
    (queryBuilderMock.andWhere as jest.Mock).mockReturnValue(queryBuilderMock);

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
        {
          provide: IndexerStateService,
          useValue: { getLastReadyBlockNumber: jest.fn().mockResolvedValue(lastReadyBlockNumber) },
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
      (queryBuilderMock.getOne as jest.Mock).mockResolvedValue(addressRecord);
    });

    it("queries addresses by specified address and watermark", async () => {
      await service.findOne(blockchainAddress);
      expect(queryBuilderMock.where).toHaveBeenCalledWith("address.address = :address", { address: blockchainAddress });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        '(address."createdInBlockNumber" IS NULL OR address."createdInBlockNumber" <= :lastReadyBlockNumber)',
        { lastReadyBlockNumber }
      );
    });

    it("returns addressRecord by address", async () => {
      const result = await service.findOne(blockchainAddress);
      expect(result).toBe(addressRecord);
    });
  });

  describe("findByAddresses", () => {
    beforeEach(() => {
      (queryBuilderMock.getMany as jest.Mock).mockResolvedValue([addressRecord]);
    });

    it("returns empty array when addresses list is empty", async () => {
      const result = await service.findByAddresses([]);
      expect(result).toEqual([]);
      expect(repositoryMock.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("queries addresses by specified addresses list and watermark", async () => {
      await service.findByAddresses([blockchainAddress]);
      expect(queryBuilderMock.where).toHaveBeenCalledWith("address.address IN (:...addresses)", {
        addresses: [blockchainAddress],
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        '(address."createdInBlockNumber" IS NULL OR address."createdInBlockNumber" <= :lastReadyBlockNumber)',
        { lastReadyBlockNumber }
      );
    });

    it("returns address records", async () => {
      const result = await service.findByAddresses([blockchainAddress]);
      expect(result).toEqual([addressRecord]);
    });
  });
});
