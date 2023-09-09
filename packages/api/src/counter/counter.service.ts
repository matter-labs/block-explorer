import { Injectable } from "@nestjs/common";
import { Repository, EntityTarget, getMetadataArgsStorage } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CounterCriteria } from "../common/types";
import { Counter } from "./counter.entity";
import { getQueryString, isCounterSupported } from "./counter.utils";

@Injectable()
export class CounterService {
  public constructor(
    @InjectRepository(Counter)
    private readonly counterRepository: Repository<Counter>
  ) {}

  public async count<T>(entityClass: EntityTarget<T>, counterCriteria: CounterCriteria<T> = {}): Promise<number> {
    const tableName = this.getTableNameForEntity(entityClass);
    const queryString = getQueryString(counterCriteria);
    if (!isCounterSupported<T>(tableName, counterCriteria)) {
      throw new Error(`Counter for table ${tableName} and criteria "${queryString}" is not supported`);
    }
    const counter = await this.counterRepository.findOne({
      where: {
        tableName,
        queryString,
      },
      select: ["count"],
    });
    return counter?.count || 0;
  }

  private getTableNameForEntity<T>(entityClass: EntityTarget<T>): string {
    const table = getMetadataArgsStorage().tables.find((t) => t.target === entityClass);
    return table.name;
  }
}
