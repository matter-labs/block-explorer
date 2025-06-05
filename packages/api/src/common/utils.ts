import { MoreThanOrEqual, LessThanOrEqual, Between, SelectQueryBuilder } from "typeorm";
import { IPaginationMeta, createPaginationObject, Pagination } from "nestjs-typeorm-paginate";

import { NumerableEntity } from "../common/entities/numerable.entity";
import { hexTransformer } from "./transformers/hex.transformer";
import { IPaginationOptions } from "./types";

const MIN_OFFSET_TO_USE_NUMBER_FILTER = 1000;

export const buildDateFilter = (fromDate: string, toDate: string, fieldName = "timestamp") => {
  return fromDate && toDate
    ? {
        [fieldName]: Between(new Date(fromDate), new Date(toDate)),
      }
    : {
        ...(fromDate && { [fieldName]: MoreThanOrEqual(new Date(fromDate)) }),
        ...(toDate && { [fieldName]: LessThanOrEqual(new Date(toDate)) }),
      };
};

async function countQueryWithLimit<T, CustomMetaType = IPaginationMeta>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions<CustomMetaType>
): Promise<number> {
  const totalQueryBuilder = queryBuilder.clone();

  totalQueryBuilder.select("true");
  totalQueryBuilder.skip(undefined);
  totalQueryBuilder.limit(options.maxLimit);
  totalQueryBuilder.offset(undefined);
  totalQueryBuilder.take(undefined);

  const countQueryBuilder = queryBuilder.connection.createQueryBuilder();
  countQueryBuilder.select("COUNT(*)", "value");
  countQueryBuilder.from(`(${totalQueryBuilder.getQuery()})`, "uniqueTableAlias");
  countQueryBuilder.setParameters(queryBuilder.getParameters());
  const { value } = await countQueryBuilder.getRawOne<{ value: string }>();

  return Number(value);
}

async function paginateQueryBuilder<T, CustomMetaType = IPaginationMeta>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions<CustomMetaType>,
  countQuery?: () => Promise<number>
): Promise<Pagination<T, CustomMetaType>> {
  const limit = options.limit as number;
  const page = options.page as number;
  const offset = (page - 1) * limit;

  queryBuilder.limit(limit);

  if (options.canUseNumberFilterAsOffset && offset >= MIN_OFFSET_TO_USE_NUMBER_FILTER) {
    const topItem = (await queryBuilder.clone().limit(1).getOne()) as NumerableEntity;
    const topItemNumber = topItem?.number ?? -1;

    queryBuilder
      .andWhere({
        number: LessThanOrEqual(topItemNumber - offset),
      })
      .offset(0);
  } else {
    queryBuilder.offset(offset);
  }

  const [items, total] = await Promise.all([
    queryBuilder.getMany(),
    countQuery ? countQuery() : countQueryWithLimit(queryBuilder, options),
  ]);

  return createPaginationObject<T, CustomMetaType>({
    items,
    totalItems: total,
    currentPage: page,
    limit,
    route: options.route,
  });
}

export const paginate = async <T, CustomMetaType = IPaginationMeta>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions<CustomMetaType>,
  countQuery?: () => Promise<number>
) => {
  const result = await paginateQueryBuilder(queryBuilder, options, countQuery);

  if (!result?.links || !options.filterOptions) {
    return result;
  }
  for (const link of Object.keys(result.links)) {
    if (!result.links[link]) {
      continue;
    }
    for (const filterOption of Object.keys(options.filterOptions)) {
      const filterOptionValue = options.filterOptions[filterOption];
      if (filterOptionValue === null || filterOptionValue === undefined) {
        continue;
      }
      result.links[link] = `${result.links[link]}&${filterOption}=${encodeURIComponent(
        options.filterOptions[filterOption]
      )}`;
    }
  }
  return result;
};

export const formatHexAddress = (address: string) => hexTransformer.from(hexTransformer.to(address));

export const getMethodId = (data: string) => (data.length > 10 ? data.substring(0, 10) : "0x");

export const dateToTimestamp = (date: Date) => Math.floor(date.getTime() / 1000);

export const numberToHex = (num: number | bigint) => (num != null ? `0x${num.toString(16)}` : "0x");

export const parseIntToHex = (numStr: string) => {
  if (numStr != null) {
    const parsedInt = parseInt(numStr, 10);
    if (!Number.isNaN(parsedInt)) {
      return numberToHex(parsedInt);
    }
  }
  return "0x";
};
