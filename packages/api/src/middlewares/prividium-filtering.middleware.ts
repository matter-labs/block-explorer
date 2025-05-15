import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AddressService } from "../address/address.service";
import { LogService } from "../log/log.service";
import { FilterTransactionsOptions } from "../transaction/transaction.service";
import { getUrlWithoutParams } from "../common/utils";

const OWNERSHIP_TRANSFERRED_TOPIC = "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0";

const UNFILTERED_ROUTES = ["/auth", "/batches", "/blocks", "/health", "/ready", "/stats", "/tokens"];

@Injectable()
export class PrividiumFilteringMiddleware implements NestMiddleware {
  constructor(private readonly addressService: AddressService, private readonly logService: LogService) {}

  private matchRoute(url: string, match: string): boolean {
    return url === match || url.startsWith(`${match}/`);
  }

  public async use(req: Request, res: Response, next: NextFunction) {
    const url = getUrlWithoutParams(req.originalUrl);
    if (UNFILTERED_ROUTES.some((route) => this.matchRoute(url, route))) {
      return next();
    }

    if (this.matchRoute(url, "/address")) {
      await this.filterAddressControllerRoutes(req, url);
      return next();
    }

    if (this.matchRoute(url, "/transactions")) {
      this.filterTransactionControllerRoutes(req, res, url);
      return next();
    }

    throw new ForbiddenException({ message: "Access denied" });
  }

  private async filterAddressControllerRoutes(req: Request, url: string) {
    // All routes are filtered by address
    const reqAddress = url.match(/\/address\/([^\/]+)/)?.[1];
    const userAddress = req.session.siwe.address;
    const addressRecord = await this.addressService.findOne(reqAddress);
    const isContract = !!(addressRecord && addressRecord.bytecode.length > 2);

    if (!reqAddress) {
      throw new ForbiddenException({ message: "Access denied" });
    }

    if (!isContract) {
      if (reqAddress.toLowerCase() === userAddress.toLowerCase()) {
        return;
      }
      throw new ForbiddenException({ message: "Access denied" });
    }

    // Check if user is owner of the contract
    const logs = await this.logService.findManyByTopics({
      address: reqAddress,
      topics: {
        topic0: OWNERSHIP_TRANSFERRED_TOPIC,
      },
      page: 1,
      offset: 1,
    });
    const newOwner = logs[0]?.topics[2];
    if (newOwner === undefined) {
      throw new ForbiddenException({ message: "Access denied" });
    }

    // Parse from log topic (32 bytes) to address (20 bytes)
    const newOwnerAddress = `0x${newOwner.slice(64 + 2 - 40)}`;
    if (newOwnerAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new ForbiddenException({ message: "Access denied" });
    }
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
