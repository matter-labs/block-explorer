import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { Address } from "./address.entity";
import { IndexerStateService } from "../indexerState/indexerState.service";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";

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
      .where({ address })
      .andWhere(
        new Brackets((qb) =>
          qb
            .where('address."createdInBlockNumber" IS NULL')
            .orWhere('address."createdInBlockNumber" <= :lastReadyBlockNumber', { lastReadyBlockNumber })
        )
      )
      .getOne();
  }

  public async findByAddresses(addresses: string[]): Promise<Address[]> {
    if (addresses.length === 0) {
      return [];
    }
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    return await this.addressRepository
      .createQueryBuilder("address")
      .where("address.address IN (:...addresses)", {
        addresses: addresses.map((a) => normalizeAddressTransformer.to(a)),
      })
      .andWhere(
        new Brackets((qb) =>
          qb
            .where('address."createdInBlockNumber" IS NULL')
            .orWhere('address."createdInBlockNumber" <= :lastReadyBlockNumber', { lastReadyBlockNumber })
        )
      )
      .getMany();
  }
}
