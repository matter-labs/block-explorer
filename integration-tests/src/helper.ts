import { execSync } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";

import { Logger } from "./entities";

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
}
