import "express";
import { FilterTransactionsOptions } from "./transaction/transaction.service";

declare module "express" {
  export interface Response {
    locals: {
      filterTransactionsOptions?: FilterTransactionsOptions;
    };
  }
}
