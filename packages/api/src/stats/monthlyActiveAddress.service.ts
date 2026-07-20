import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MonthlyActiveAddressCount } from "./monthlyActiveAddressCount.entity";

@Injectable()
export class MonthlyActiveAddressService {
  public constructor(
    @InjectRepository(MonthlyActiveAddressCount)
    private readonly repository: Repository<MonthlyActiveAddressCount>
  ) {}

  public async getCount(month: string): Promise<number> {
    const row = await this.repository.findOne({ where: { month: `${month}-01` } });
    return row?.count ?? 0;
  }
}
