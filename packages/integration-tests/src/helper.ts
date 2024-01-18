import { execSync } from "child_process";
import { ethers } from "ethers";
import { promises as fs } from "fs";
import * as path from "path";
import * as request from "supertest";
import { Provider } from "zksync-web3";

import { environment, localConfig } from "./config";
import { Logger } from "./entities";

import type { BaseProvider } from "@ethersproject/providers/src.ts/base-provider";

export class Helper {
  async txHashLogger(txType: string, txValue: string, tokenName?: string) {
    const logMessage = `TxHash for ${txType} ${Logger.textSeparator} ${txValue}`;

    if (tokenName === undefined) {
      return console.log(logMessage);
    } else {
      return console.log(logMessage, ` ${tokenName}`);
    }
  }

  async executeScript(script: string) {
    const output = execSync(script, { encoding: "utf-8" });

    try {
      console.log(`> Run NPM Script "${script}":\n`, output);
      return output;
    } catch (e) {
      console.log(e);
    }
  }

  async getStringFromFile(fileName: string) {
    const absoluteRoute = path.join(__dirname, "..", fileName);

    try {
      return await fs.readFile(absoluteRoute, { encoding: "utf-8" });
    } catch {
      console.log(`There is no the expected file: ${fileName}`);
    }
  }

  async getBalanceETH(walletAddress: string, layer: string) {
    let network: string;
    let provider: BaseProvider;
    if (layer == "L1") {
      network = localConfig.L1Network;
      provider = ethers.getDefaultProvider(network);
    } else if (layer == "L2") {
      network = localConfig.L2Network;
      provider = new Provider(network);
    } else {
      console.log(`Wrong layer: ${layer}`);
    }
    return ethers.utils.formatUnits(await provider.getBalance(walletAddress), "wei");
  }

  async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async performGETrequest(apiRoute: string) {
    return request(environment.blockExplorerAPI).get(apiRoute);
  }

  async retryAPIrequest(apiRoute, unsucceededResponse = false) {
    for (let i = 0; i < localConfig.maxAPIretries; i++) {
      try {
        const response = await this.performGETrequest(apiRoute);

        if (response.status === 200 || unsucceededResponse) {
          return response;
        }
      } catch (e) {
        if (localConfig.debugAPIwrapper) {
          console.error(e);
        }
      }
      await this.delay(localConfig.intervalAPIretries);
    }
    throw new Error(`There is error after the request ${localConfig.maxAPIretries} retries`);
  }
}
