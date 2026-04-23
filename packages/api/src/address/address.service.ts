import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Address } from "./address.entity";
import { IndexerStateService } from "../indexerState/indexerState.service";

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly indexerStateService: IndexerStateService
  ) {}

  public async findOne(address: string): Promise<Address> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    return await this.addressRepository
      .createQueryBuilder("address")
      .where("address.address = :address", { address })
      .andWhere('(address."createdInBlockNumber" IS NULL OR address."createdInBlockNumber" <= :lastReadyBlockNumber)', {
        lastReadyBlockNumber,
      })
      .getOne();
  }

  public async findByAddresses(addresses: string[]): Promise<Address[]> {
    if (addresses.length === 0) {
      return [];
    }
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    return await this.addressRepository
      .createQueryBuilder("address")
      .where("address.address IN (:...addresses)", { addresses })
      .andWhere('(address."createdInBlockNumber" IS NULL OR address."createdInBlockNumber" <= :lastReadyBlockNumber)', {
        lastReadyBlockNumber,
      })
      .getMany();
  }
}
