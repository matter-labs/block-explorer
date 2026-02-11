import { Injectable } from "@nestjs/common";
import { FilterTransactionsOptions } from "./transaction.service";
import { FilterTransactionsOptionsDto } from "./dtos/filterTransactionsOptions.dto";
import { ListFiltersDto } from "../common/dtos";
import { buildDateFilter, isAddressEqual } from "../common/utils";
import { VisibilityContext } from "../prividium/visibility/visibility.context";

@Injectable()
export class TransactionFilterBuilder {
  build(
    filterDto: FilterTransactionsOptionsDto,
    listFiltersDto: ListFiltersDto,
    visibility: VisibilityContext
  ): FilterTransactionsOptions {
    const base: FilterTransactionsOptions = {
      ...filterDto,
      ...buildDateFilter(listFiltersDto.fromDate, listFiltersDto.toDate, "receivedAt"),
    };

    if (!visibility.userAddress || visibility.isAdmin) {
      return base;
    }

    const filters: FilterTransactionsOptions = { ...base, filterAddressInLogTopics: true };

    // If target address is not provided, we filter by own address
    if (!filterDto.address) {
      filters.address = visibility.userAddress;
    }

    // If target address is provided and it's not own, we filter transactions between own and target address
    if (filterDto.address && !isAddressEqual(filterDto.address, visibility.userAddress)) {
      filters.visibleBy = visibility.userAddress;
    }

    return filters;
  }
}
