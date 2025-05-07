import { ContractDto } from "./dtos/contract.dto";
import { AccountDto } from "./dtos/account.dto";
import { privateValidium } from "src/config/featureFlags";
import { Request } from "express";

export abstract class AddressControllerAbstract {
  protected abstract publicGetAddress(address: string, req: Request): Promise<AccountDto | ContractDto>;
  protected abstract privateGetAddress(address: string, req: Request): Promise<AccountDto | ContractDto>;

  protected dispatchGetAddress(address: string, req: Request): Promise<AccountDto | ContractDto> {
    if (privateValidium) {
      return this.privateGetAddress(address, req);
    }
    return this.publicGetAddress(address, req);
  }

  // ...rest of the controller methods
}
