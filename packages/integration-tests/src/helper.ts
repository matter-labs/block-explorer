import { exec } from "child_process";
import { AbstractProvider, ethers } from "ethers";
import { promises as fs } from "fs";
import * as path from "path";
import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment, localConfig } from "./config";
import { Logger } from "./constants";
import { getProviderForL1, getProviderForL2 } from "./provider";

export class Helper {
  async logTransaction(txType: string, txValue: string, tokenName?: string) {
    const logMessage = `TxHash for ${txType} ${Logger.textSeparator} ${txValue}`;

    if (tokenName === undefined) {
      return console.log(logMessage);
    } else {
      return console.log(logMessage, ` ${tokenName}`);
    }
  }

  async executeScript(script: string) {
    return new Promise((resolve, reject) => {
      exec(script, { encoding: "utf-8" }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing script "${script}":`, error);
          console.error(`stderr executing script "${script}":`, stderr);
          reject(error);
        } else {
          console.log(`> Run NPM Script "${script}":\n`, stdout);
          resolve(stdout);
        }
      });
    });
  }

  async writeFile(filePath: string, fileName: string, data: string) {
    const absoluteRoute = path.join(filePath, fileName);
    await fs.writeFile(absoluteRoute, data);
  }

  async readFile(filePath: string, fileName: string) {
    const absoluteRoute = path.join(filePath, fileName);
    return await fs.readFile(absoluteRoute, { encoding: "utf-8" });
  }

  async getBalanceETH(walletAddress: string, layer: string) {
    let network: string;
    let provider: any;
    if (layer == "L1") {
      network = localConfig.L1Network;
      provider = getProviderForL1(network);
    } else if (layer == "L2") {
      network = localConfig.L2Network;
      provider = getProviderForL2(network);
    } else {
      console.log(`Wrong layer: ${layer}`);
    }
    return ethers.formatUnits(await provider.getBalance(walletAddress), "wei");
  }

  async delay(ms: number) {
    await setTimeout(ms);
  }

  async performBlockExplorerApiGetRequest(apiRoute: string, network = "local") {
    if (network === `sepolia`) {
      return request(environment.blockExplorerSepoliaAPI).get(apiRoute);
    } else if (network === `local`) {
      return request(environment.blockExplorerAPI).get(apiRoute);
    } else {
      throw new Error(`The API route for the network ${network} is undefined.`);
    }
  }

  /**
   * A retry wrapper method to enhance test stability in API testing.
   * Useful when API response fields may not immediately reflect the expected state,
   * but can update to the correct response after a delay.
   * Attempts to execute the action a specified number of times (defined in localConfig.maxAPIretries)
   * with a delay between attempts (localConfig.intervalAPIretries).
   * Throws an error if the action consistently fails after all retries.
   */
  async runRetriableTestAction(action) {
    for (let i = 0; i < localConfig.maxAPIretries; i++) {
      try {
        await action();
        return;
      } catch (error) {
        if (i === localConfig.maxAPIretries - 1) {
          throw error;
        }
        await this.delay(localConfig.intervalAPIretries);
      }
    }
  }
}
