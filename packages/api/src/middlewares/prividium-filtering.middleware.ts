import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AddressService } from "../address/address.service";
import { LogService } from "../log/log.service";
import { parseReqPathname } from "../common/utils";
import { zeroPadValue } from "ethers";

/** Hash of event `OwnershipTransferred(address indexed previousOwner, address indexed newOwner)` */
const OWNERSHIP_TRANSFERRED_TOPIC = "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0";

const UNFILTERED_ROUTES = ["/auth", "/batches", "/blocks", "/health", "/ready", "/stats"];

@Injectable()
export class PrividiumFilteringMiddleware implements NestMiddleware {
  constructor(private readonly addressService: AddressService, private readonly logService: LogService) {}

  public async use(req: Request, res: Response, next: NextFunction) {
    const pathname = parseReqPathname(req);
    if (UNFILTERED_ROUTES.some((route) => this.matchRoute(pathname, route))) {
      return next();
    }

    if (this.matchRoute(pathname, "/address")) {
      await this.filterAddressControllerRoutes(req, pathname, res);
      return next();
    }

    if (this.matchRoute(pathname, "/transactions")) {
      this.filterTransactionControllerRoutes(req, res, pathname);
      return next();
    }

    if (this.matchRoute(pathname, "/tokens")) {
      this.filterTokenControllerRoutes(req, res, pathname);
      return next();
    }

    throw new ForbiddenException();
  }

  private async filterAddressControllerRoutes(req: Request, pathname: string, res: Response) {
    // All routes are filtered by address located in the path
    // /address/0x123/logs -> 0x123
    const pathSegments = pathname.split("/");
    const reqAddress = pathSegments[2];
    const userAddress = req.session.siwe.address;

    // If no address is specified this keeps the chain and ends in not found
    // because /address does not exist.
    if (!reqAddress) {
      return;
    }

    if (pathSegments[3] === "logs") {
      res.locals.filterAddressLogsOptions = {
        visibleBy: userAddress,
      };
      return;
    }

    if (pathSegments[3] === "transfers") {
      if (!this.isOwnAddress(req, reqAddress)) {
        res.locals.filterAddressTransferOptions = {
          visibleBy: userAddress,
        };
      }
      return;
    }

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

    const isOwner = newOwner?.toLowerCase() === zeroPadValue(userAddress, 32).toLowerCase();
    res.locals.filterAddressOptions = {
      includeBalances: isOwner,
    };
  }

  private filterTokenControllerRoutes(req: Request, res: Response, pathname: string) {
    const userAddress = req.session.siwe.address;
    const pathSegments = pathname.split("/");
    if (pathSegments[3] === "transfers") {
      res.locals.tokenTransfersOptions = {
        address: userAddress,
      };
    }
  }

  private filterTransactionControllerRoutes(req: Request, res: Response, pathname: string) {
    // Only /transactions route is filtered by address
    if (pathname === "/transactions") {
      res.locals.filterTransactionsOptions = {
        visibleBy: req.session.siwe.address,
      };
    }
    return;
  }

  private matchRoute(url: string, match: string): boolean {
    return url === match || url.startsWith(`${match}/`);
  }

  private isOwnAddress(req: Request, address: string): boolean {
    return req.session.siwe.address.toLowerCase() === address.toLowerCase();
  }
}
