import { ForbiddenException, Injectable, InternalServerErrorException, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AddressService } from "../address/address.service";
import { LogService } from "../log/log.service";
import { FilterTransactionsOptions } from "../transaction/transaction.service";

const OWNERSHIP_TRANSFERRED_TOPIC = "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0";

@Injectable()
export class PrividiumFilteringMiddleware implements NestMiddleware {
  constructor(private readonly addressService: AddressService, private readonly logService: LogService) {}

  public async use(req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith("/address")) {
      await this.filterAddressControllerRoutes(req);
      return next();
    }

    if (req.path.startsWith("/transactions")) {
      this.filterTransactionControllerRoutes(req, res);
      return next();
    }

    throw new InternalServerErrorException({ message: "Internal server error" });
  }

  private async filterAddressControllerRoutes(req: Request) {
    // All routes are filtered by address
    const reqAddress = req.path.match(/\/address\/([^\/]+)/)?.[1];
    const userAddress = req.session.siwe.address;
    const addressRecord = await this.addressService.findOne(reqAddress);
    const isContract = !!(addressRecord && addressRecord.bytecode.length > 2);

    if (!reqAddress) {
      throw new ForbiddenException({ message: "User does not have access to this address" });
    }

    if (!isContract) {
      if (reqAddress.toLowerCase() === userAddress.toLowerCase()) {
        return;
      }
      throw new ForbiddenException({ message: "User does not have access to this address" });
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
      throw new ForbiddenException({ message: "User does not have access to this address" });
    }

    // Parse from log topic (32 bytes) to address (20 bytes)
    const newOwnerAddress = `0x${newOwner.slice(64 + 2 - 40)}`;
    if (newOwnerAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new ForbiddenException({ message: "User does not have access to this address" });
    }
  }

  private filterTransactionControllerRoutes(req: Request, res: Response) {
    // Only /transactions route is filtered by address
    if (req.path === "/transactions") {
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
