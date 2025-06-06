import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AddressService } from "../address/address.service";
import { LogService } from "../log/log.service";
import { parseReqPathname } from "../common/utils";

/** Hash of event `OwnershipTransferred(address indexed previousOwner, address indexed newOwner)` */
const OWNERSHIP_TRANSFERRED_TOPIC = "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0";

const UNFILTERED_ROUTES = ["/auth", "/batches", "/blocks", "/health", "/ready", "/stats", "/tokens"];

@Injectable()
export class PrividiumFilteringMiddleware implements NestMiddleware {
  constructor(private readonly addressService: AddressService, private readonly logService: LogService) {}

  public async use(req: Request, res: Response, next: NextFunction) {
    const pathname = parseReqPathname(req);
    if (UNFILTERED_ROUTES.some((route) => this.matchRoute(pathname, route))) {
      return next();
    }

    if (this.matchRoute(pathname, "/address")) {
      await this.filterAddressControllerRoutes(req, pathname);
      return next();
    }

    if (this.matchRoute(pathname, "/transactions")) {
      this.filterTransactionControllerRoutes(req, res, pathname);
      return next();
    }

    throw new ForbiddenException();
  }

  private async filterAddressControllerRoutes(req: Request, pathname: string) {
    // All routes are filtered by address located in the path
    // /address/0x123/logs -> 0x123
    const pathSegments = pathname.split("/");
    const reqAddress = pathSegments[2];
    if (!reqAddress) {
      return;
    }

    const userAddress = req.session.siwe.address;
    const addressRecord = await this.addressService.findOne(reqAddress);
    const isContract = !!(addressRecord && addressRecord.bytecode.length > 2);

    if (!isContract) {
      if (this.isOwnAddress(req, reqAddress)) {
        return;
      }
      throw new ForbiddenException();
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
      throw new ForbiddenException();
    }

    // Parse from log topic (32 bytes) to address (20 bytes)
    const newOwnerAddress = `0x${newOwner.slice(64 + 2 - 40)}`;
    if (newOwnerAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new ForbiddenException();
    }
  }

  private filterTransactionControllerRoutes(req: Request, res: Response, pathname: string) {
    const targetAddress = req.query.address as string;

    // Only /transactions route is filtered by address
    if (pathname !== "/transactions") {
      return;
    }

    // If target address is not provided, we filter by own address
    if (!targetAddress) {
      res.locals.filterTransactionsOptions = {
        address: req.session.siwe.address,
        filterAddressInLogTopics: true,
      };
      return;
    }

    // If target address is provided, and it's own address, transaction is not filtered
    if (this.isOwnAddress(req, targetAddress)) {
      res.locals.filterTransactionsOptions = {
        filterAddressInLogTopics: true,
      };
      return;
    }

    // If target address is provided, and it's not own address, we filter transactions
    // between own address and target address
    res.locals.filterTransactionsOptions = {
      visibleBy: req.session.siwe.address,
      filterAddressInLogTopics: true,
    };
    return;
  }

  private matchRoute(url: string, match: string): boolean {
    return url === match || url.startsWith(`${match}/`);
  }

  private isOwnAddress(req: Request, address: string): boolean {
    return req.session.siwe.address.toLowerCase() === address.toLowerCase();
  }
}
