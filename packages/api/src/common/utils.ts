import { MoreThanOrEqual, LessThanOrEqual, Between, SelectQueryBuilder } from "typeorm";
import { IPaginationMeta, createPaginationObject, Pagination } from "nestjs-typeorm-paginate";

import { NumerableEntity } from "./entities/numerable.entity";
import { hexTransformer } from "./transformers/hex.transformer";
import { IPaginationOptions } from "./types";
import { Request } from "express";
import { getAddress } from "ethers";

const MIN_OFFSET_TO_USE_NUMBER_FILTER = 1000;

export function copyOrderBy<S, T>(source: SelectQueryBuilder<S>, target: SelectQueryBuilder<T>, toAlias: string): void {
  for (const [key, dir] of Object.entries(source.expressionMap.orderBys)) {
    const column = key.split(".").pop();
    target.addOrderBy(`${toAlias}.${column}`, dir as "ASC" | "DESC");
  }
}

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

/**
 * Clones the query builder, applies pagination (limit, offset) and returns the clone.
 * When canUseNumberFilterAsOffset is set and offset >= 1000, uses a WHERE filter on
 * the `number` column instead of SQL OFFSET for better performance.
 */
async function buildPaginatedQuery<T, CustomMetaType = IPaginationMeta>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions<CustomMetaType>
): Promise<SelectQueryBuilder<T>> {
  const limit = options.limit as number;
  const page = options.page as number;
  const offset = (page - 1) * limit;

  const paginatedQb = queryBuilder.clone();
  paginatedQb.limit(limit);

  const useNumberFilterAsOffset = options.canUseNumberFilterAsOffset && offset >= MIN_OFFSET_TO_USE_NUMBER_FILTER;
  if (useNumberFilterAsOffset) {
    const topItem = (await paginatedQb.clone().limit(1).getOne()) as NumerableEntity;
    const topItemNumber = topItem?.number ?? -1;
    paginatedQb.andWhere({ number: LessThanOrEqual(topItemNumber - offset) }).offset(0);
  } else {
    paginatedQb.offset(offset);
  }

  return paginatedQb;
}

/**
 * Builds a COUNT query from the given query builder.
 * Clones the query builder, wraps it as a subquery, and counts the results.
 * Returns a query builder ready to execute with getRawOne<{ value: string }>().
 */
function buildCountQuery<T, CustomMetaType = IPaginationMeta>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions<CustomMetaType>
): SelectQueryBuilder<unknown> {
  const subQb = queryBuilder.clone();
  subQb.select("true");
  if (subQb.expressionMap?.joinAttributes) {
    subQb.expressionMap.joinAttributes = [];
  }
  subQb.skip(undefined);
  subQb.limit(options.maxLimit);
  subQb.offset(undefined);
  subQb.take(undefined);
  subQb.orderBy(undefined);

  const countQb = queryBuilder.connection.createQueryBuilder();
  countQb.select("COUNT(*)", "value");
  countQb.from(`(${subQb.getQuery()})`, "_count");
  countQb.setParameters(queryBuilder.getParameters());
  return countQb;
}

/**
 * Applies pagination to the query, optionally wraps it in an outer query
 * via wrapQuery callback, then executes items + count in parallel.
 *
 * @param wrapQuery - async callback receiving the paginated QB, returns the final items QB.
 *                    Use this to build outer queries with joins around the paginated subquery.
 */
export const paginate = async <T, CustomMetaType = IPaginationMeta>({
  queryBuilder,
  options,
  wrapQuery,
  countQuery,
}: {
  queryBuilder: SelectQueryBuilder<T>;
  options: IPaginationOptions<CustomMetaType>;
  wrapQuery?: (paginatedQb: SelectQueryBuilder<T>) => Promise<SelectQueryBuilder<T>>;
  countQuery?: () => Promise<number>;
}): Promise<Pagination<T, CustomMetaType>> => {
  const countFn =
    countQuery ??
    (async () => {
      const countQb = buildCountQuery(queryBuilder, options);
      const { value } = await countQb.getRawOne<{ value: string }>();
      return Number(value);
    });

  const itemsFn = async () => {
    const paginatedQb = await buildPaginatedQuery(queryBuilder, options);
    const itemsQb = wrapQuery ? await wrapQuery(paginatedQb) : paginatedQb;
    return itemsQb.getMany();
  };

  const [items, total] = await Promise.all([itemsFn(), countFn()]);

  const result = createPaginationObject<T, CustomMetaType>({
    items,
    totalItems: total,
    currentPage: options.page as number,
    limit: options.limit as number,
    route: options.route,
  });

  if (result.links && options.filterOptions) {
    for (const link of Object.keys(result.links)) {
      if (!result.links[link]) continue;
      for (const filterOption of Object.keys(options.filterOptions)) {
        const filterOptionValue = options.filterOptions[filterOption];
        if (filterOptionValue === null || filterOptionValue === undefined) continue;
        result.links[link] = `${result.links[link]}&${filterOption}=${encodeURIComponent(filterOptionValue)}`;
      }
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

/**
 * Parses the request pathname from the request object
 */
export const parseReqPathname = (req: Request) => {
  return new URL(req.originalUrl, "http://localhost").pathname;
};

/**
 * Compares two addresses and returns true if they are the same.
 * If one of the addresses is invalid, returns false.
 */
export const isAddressEqual = (address1: string, address2: string): boolean => {
  try {
    return getAddress(address1) === getAddress(address2);
  } catch {
    return false;
  }
};

export const computeFromToMinMax = (
  from: string,
  to?: string
): { fromToMin: string | null; fromToMax: string | null } => {
  if (!from || !to) return { fromToMin: null, fromToMax: null };
  return from.toLowerCase() <= to.toLowerCase()
    ? { fromToMin: from, fromToMax: to }
    : { fromToMin: to, fromToMax: from };
};
