import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Address } from "./address.entity";

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>
  ) {}

  public async findOne(address: string): Promise<Address> {
    return await this.addressRepository.findOneBy({ address });
  }

  public async findByAddresses(addresses: string[]): Promise<Address[]> {
    return await this.addressRepository.find({
      where: {
        address: In(addresses),
      },
    });
  }
}
