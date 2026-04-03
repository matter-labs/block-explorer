import { MoreThanOrEqual, LessThanOrEqual, Between, SelectQueryBuilder } from "typeorm";
import { IPaginationMeta, createPaginationObject, Pagination } from "nestjs-typeorm-paginate";

import { NumerableEntity } from "./entities/numerable.entity";
import { hexTransformer } from "./transformers/hex.transformer";
import { IPaginationOptions } from "./types";
import { Request } from "express";
import { getAddress } from "ethers";

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
  // Remove any joins to improve performance
  if (totalQueryBuilder.expressionMap?.joinAttributes) {
    totalQueryBuilder.expressionMap.joinAttributes = [];
  }
  totalQueryBuilder.skip(undefined);
  totalQueryBuilder.limit(options.maxLimit);
  totalQueryBuilder.offset(undefined);
  totalQueryBuilder.take(undefined);
  totalQueryBuilder.orderBy(undefined);

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

  const useNumberFilterAsOffset = options.canUseNumberFilterAsOffset && offset >= MIN_OFFSET_TO_USE_NUMBER_FILTER;
  if (useNumberFilterAsOffset) {
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

  let itemsQuery = queryBuilder;
  // When canUseNumberFilterAsOffset is active, pagination is already efficient — skip deferred joins
  if (options.deferJoins && !useNumberFilterAsOffset) {
    const alias = queryBuilder.alias;
    const pkColumn = queryBuilder.expressionMap.mainAlias?.metadata?.primaryColumns[0]?.databaseName;
    const paginateBy = options.paginateBy;
    const paginateByJoin = queryBuilder.expressionMap.joinAttributes.find((j) => j.alias.name === paginateBy);

    if (pkColumn && paginateByJoin) {
      // paginateBy points to a joined table — build inner query directly on that table for index-only scan
      const joinColumns = paginateByJoin.relation?.joinColumns.length
        ? paginateByJoin.relation.joinColumns
        : paginateByJoin.relation?.inverseRelation?.joinColumns;
      const fkColumn = joinColumns?.[0]?.databaseName;
      const targetPkColumn = joinColumns?.[0]?.referencedColumn?.databaseName;
      const tableName = paginateByJoin.tablePath;

      if (fkColumn && targetPkColumn && tableName) {
        // Inner query: scan only the paginateBy table, select FK, apply all filters + ordering + offset/limit
        const innerQb = queryBuilder.connection.createQueryBuilder().from(tableName, paginateBy);
        innerQb.select(`${paginateBy}.${fkColumn}`, fkColumn);
        innerQb.expressionMap.wheres = [...queryBuilder.expressionMap.wheres];
        innerQb.setParameters(queryBuilder.getParameters());
        innerQb.orderBy(queryBuilder.expressionMap.orderBys);
        innerQb.offset(queryBuilder.expressionMap.offset);
        innerQb.limit(queryBuilder.expressionMap.limit);

        // Outer query: clone original with all LEFT JOINs, replace filters with subquery match
        const outerQb = queryBuilder.clone();
        outerQb.expressionMap.wheres = [];
        outerQb.offset(undefined);
        outerQb.limit(undefined);
        const originalJoins = outerQb.expressionMap.joinAttributes.splice(0);
        outerQb.innerJoin(
          `(${innerQb.getQuery()})`,
          "_paginated",
          `"_paginated"."${fkColumn}" = "${alias}"."${targetPkColumn}"`
        );
        outerQb.expressionMap.joinAttributes.push(...originalJoins.filter((j) => j.alias.name !== paginateBy));

        itemsQuery = outerQb;
      }
    } else if (pkColumn) {
      // paginateBy matches root or not set — paginate on root table, defer all joins
      const innerQb = queryBuilder.clone();
      innerQb.select(`${alias}.${pkColumn}`, pkColumn);
      innerQb.expressionMap.joinAttributes = [];

      const outerQb = queryBuilder.clone();
      outerQb.expressionMap.wheres = [];
      outerQb.offset(undefined);
      outerQb.limit(undefined);
      const originalJoins = outerQb.expressionMap.joinAttributes.splice(0);
      outerQb.innerJoin(
        `(${innerQb.getQuery()})`,
        "_paginated",
        `"_paginated"."${pkColumn}" = "${alias}"."${pkColumn}"`
      );
      outerQb.expressionMap.joinAttributes.push(...originalJoins);

      itemsQuery = outerQb;
    }
  }

  const [items, total] = await Promise.all([
    itemsQuery.getMany(),
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

export const applyFilterAlias = <T extends Record<string, unknown>>(
  alias: string,
  filters: T
): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [`${alias}.${k}`, v])
  );
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
