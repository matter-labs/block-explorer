import { types } from "zksync-ethers";
import { Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { LogType, isLogOfType } from "../log/logType";
import { BlockchainService } from "../blockchain/blockchain.service";
import { GET_TOKEN_INFO_DURATION_METRIC_NAME } from "../metrics";
import { ContractAddress } from "../address/interface/contractAddress.interface";
import parseLog from "../utils/parseLog";
import { CONTRACT_INTERFACES, BASE_TOKEN_ADDRESS, ETH_L1_ADDRESS } from "../constants";

export interface Token {
  l2Address: string;
  l1Address: string;
  symbol: string;
  decimals: number;
  name: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

export enum TokenType {
  BaseToken = "BASETOKEN",
  ERC20 = "ERC20",
  ERC721 = "ERC721",
}

@Injectable()
export class TokenService {
  private readonly logger: Logger;

  constructor(
    private readonly blockchainService: BlockchainService,
    @InjectMetric(GET_TOKEN_INFO_DURATION_METRIC_NAME)
    private readonly getTokenInfoDurationMetric: Histogram
  ) {
    this.logger = new Logger(TokenService.name);
  }

  private async getERC20TokenData(contractAddress: string): Promise<{
    symbol: string;
    decimals: number;
    name: string;
  }> {
    try {
      return await this.blockchainService.getERC20TokenData(contractAddress);
    } catch {
      this.logger.log({
        message: "Cannot parse ERC20 contract. Might be a token of a different type.",
        contractAddress,
      });
      return null;
    }
  }

  private removeSpecialChars(str: string | null): string {
    if (!str) {
      return str;
    }
    return str.replace(/\0/g, "");
  }

  public async getERC20Token(
    contractAddress: ContractAddress,
    transactionReceipt?: types.TransactionReceipt
  ): Promise<Token | null> {
    let erc20Token: {
      symbol: string;
      decimals: number;
      name: string;
      l1Address?: string;
    };

    const bridgeLog =
      transactionReceipt &&
      transactionReceipt.to.toLowerCase() === this.blockchainService.bridgeAddresses.l2Erc20DefaultBridge &&
      transactionReceipt.logs?.find(
        (log) =>
          isLogOfType(log, [LogType.BridgeInitialization, LogType.BridgeInitialize]) &&
          log.address.toLowerCase() === contractAddress.address.toLowerCase()
      );

    if (bridgeLog) {
      const parsedLog = parseLog(CONTRACT_INTERFACES.L2_STANDARD_ERC20, bridgeLog);
      erc20Token = {
        name: parsedLog.args.name,
        symbol: parsedLog.args.symbol,
        decimals: parsedLog.args.decimals,
        l1Address: parsedLog.args.l1Token,
      };
    } else {
      const stopGetTokenInfoDurationMetric = this.getTokenInfoDurationMetric.startTimer();
      erc20Token = await this.getERC20TokenData(contractAddress.address);
      if (erc20Token) {
        stopGetTokenInfoDurationMetric();
      }
    }

    if (erc20Token) {
      erc20Token.symbol = this.removeSpecialChars(erc20Token.symbol);
      erc20Token.name = this.removeSpecialChars(erc20Token.name);

      if (erc20Token.symbol) {
        return {
          ...erc20Token,
          blockNumber: contractAddress.blockNumber,
          transactionHash: contractAddress.transactionHash,
          l2Address: contractAddress.address,
          logIndex: contractAddress.logIndex,
          // add L1 address for ETH token
          ...(contractAddress.address.toLowerCase() === BASE_TOKEN_ADDRESS && {
            l1Address: ETH_L1_ADDRESS,
          }),
        };
      }
    }

    return null;
  }
}
