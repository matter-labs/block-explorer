import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AddressService } from "../address/address.service";
import { LogService } from "../log/log.service";
import { FilterTransactionsOptions } from "../transaction/transaction.service";

const OWNERSHIP_TRANSFERRED_TOPIC = "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0";

const UNFILTERED_ROUTES = ["/auth", "/batches", "/blocks", "/health", "/ready", "/stats", "/tokens", "/address"];

@Injectable()
export class PrividiumFilteringMiddleware implements NestMiddleware {
  constructor(private readonly addressService: AddressService, private readonly logService: LogService) {}

  private matchRoute(url: string, match: string): boolean {
    return url === match || url.startsWith(`${match}/`);
  }

  public async use(req: Request, res: Response, next: NextFunction) {
    const path = req.baseUrl;
    if (UNFILTERED_ROUTES.some((route) => this.matchRoute(path, route))) {
      return next();
    }

    if (this.matchRoute(path, "/transactions")) {
      this.filterTransactionControllerRoutes(req, res, path);
      return next();
    }

    throw new ForbiddenException({ message: "Access denied" });
  }

  private filterTransactionControllerRoutes(req: Request, res: Response, url: string) {
    // Only /transactions route is filtered by address
    if (url === "/transactions") {
      const filter: FilterTransactionsOptions = {
        address: req.session.siwe.address,
        filterAddressInLogTopics: true,
      };
      res.locals.filterTransactionsOptions =
        res.locals.filterTransactionsOptions instanceof Object
          ? { ...res.locals.filterTransactionsOptions, ...filter }
          : filter;
    }
  }
}
