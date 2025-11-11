import { Injectable } from "@nestjs/common";
import { types } from "zksync-ethers";
import { ExtractProxyAddressHandler } from "./interface/extractProxyHandler.interface";
import { defaultContractUpgradableHandler } from "./extractProxyHandlers";
import { ProxyAddress } from "./interface/proxyAddress.interface";

const extractProxyHandlers: ExtractProxyAddressHandler[] = [defaultContractUpgradableHandler];

@Injectable()
export class UpgradableService {
  public async getUpgradableAddresses(
    logs: ReadonlyArray<types.Log>,
    transactionReceipt: types.TransactionReceipt
  ): Promise<ProxyAddress[]> {
    const proxyAddresses: ProxyAddress[] = [];
    if (!logs) {
      return proxyAddresses;
    }

    logs.forEach((log) => {
      const handlerForLog = extractProxyHandlers.find((handler) => handler.matches(log));
      if (!handlerForLog) {
        return;
      }

      const proxyAddress = handlerForLog.extract(log, transactionReceipt);
      if (proxyAddress) {
        proxyAddresses.push(proxyAddress);
      }
    });

    return proxyAddresses;
  }
}
