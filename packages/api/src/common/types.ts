import { IPaginationOptions as NestIPaginationOptions, IPaginationMeta } from "nestjs-typeorm-paginate";
import { TransferType } from "../transfer/transfer.entity";

interface IPaginationFilterOptions {
  fromDate?: string;
  toDate?: string;
  blockNumber?: number;
  address?: string;
  l1BatchNumber?: number;
  minLiquidity?: number;
  type?: TransferType;
}

export interface IPaginationOptions<CustomMetaType = IPaginationMeta> extends NestIPaginationOptions<CustomMetaType> {
  filterOptions?: IPaginationFilterOptions;
  maxLimit?: number;
  canUseNumberFilterAsOffset?: boolean;
}

export type CounterCriteria<T> = Partial<{
  [key in `${keyof T & string}` | `${keyof T & string}|${keyof T & string}`]: string | number | boolean;
}>;

export enum SortingOrder {
  Desc = "desc",
  Asc = "asc",
}
