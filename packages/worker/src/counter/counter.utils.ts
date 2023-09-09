import { Provider, InjectionToken } from "@nestjs/common";
import { Repository, EntityTarget } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { EntityClassOrSchema } from "@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type";
import { ConfigService } from "@nestjs/config";
import { UnitOfWork } from "../unitOfWork";
import { Counter, CountableEntity } from "../entities";
import { CounterRepository } from "../repositories";
import { CounterProcessor } from "./counter.processor";
import { CounterWorker } from "./counter.worker";
import { CounterCriteria } from "./counter.types";

export const getQueryString = (query: Record<string, string>) => {
  const searchParams = new URLSearchParams(query);
  searchParams.sort();
  return searchParams.toString();
};

export const calculateCounters = <T>(
  tableName: string,
  records: T[],
  criteriaList: Array<CounterCriteria<T>>
): Partial<Counter>[] => {
  const countersMap = {};

  for (const criteria of criteriaList) {
    for (const record of records) {
      let counters = [];
      for (const conditionFieldSet of criteria) {
        const countersToExtend = counters;
        counters = [];

        const fields = conditionFieldSet.split("|");
        const conditionFieldSetValues = new Set();

        for (const field of fields) {
          const recordFieldValue = record[field];
          if (conditionFieldSetValues.has(recordFieldValue)) {
            continue;
          }
          conditionFieldSetValues.add(recordFieldValue);
          if (!countersToExtend.length) {
            counters.push({
              [conditionFieldSet]: recordFieldValue,
            });
          }
          for (const counterToExtend of countersToExtend) {
            counters.push({
              ...counterToExtend,
              [conditionFieldSet]: recordFieldValue,
            });
          }
        }
      }

      for (const counter of counters) {
        const queryString = getQueryString(counter);
        if (!countersMap[queryString]) {
          countersMap[queryString] = 1;
        } else {
          countersMap[queryString] += 1;
        }
      }
    }
  }

  const counters = [
    {
      tableName,
      queryString: getQueryString({}),
      count: records.length,
    },
  ];

  for (const queryString of Object.keys(countersMap)) {
    counters.push({
      tableName,
      queryString,
      count: countersMap[queryString],
    });
  }

  return counters;
};

export const getCounterWorkerProvider = <T extends CountableEntity>(
  injectionToken: InjectionToken,
  entityClass: EntityTarget<T>,
  criteriaList: Array<CounterCriteria<T>>
): Provider<CounterWorker<T>> => ({
  provide: injectionToken,
  inject: [ConfigService, UnitOfWork, getRepositoryToken(entityClass as EntityClassOrSchema), CounterRepository],
  useFactory: (
    configService: ConfigService,
    unitOfWork: UnitOfWork,
    repository: Repository<T>,
    counterRepository: CounterRepository
  ) => {
    return new CounterWorker<T>(
      new CounterProcessor<T>(
        entityClass,
        criteriaList,
        configService.get<number>("counters.recordsBatchSize"),
        unitOfWork,
        repository,
        counterRepository
      ),
      configService.get<number>("counters.updateInterval")
    );
  },
});
