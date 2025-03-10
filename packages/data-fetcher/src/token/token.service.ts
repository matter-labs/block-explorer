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
  type: TokenType;
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

  private async getTokenData(contractAddress: string): Promise<{
    name: string;
    symbol: string;
    type: TokenType;
    decimals: number;
  }> {
    const tokenData = await this.blockchainService.getTokenData(contractAddress);

    if (!tokenData) {
      return null;
    }

    return {
      ...tokenData,
      type: tokenData.type as TokenType,
    };
  }

  private removeSpecialChars(str: string | null): string {
    if (!str) {
      return str;
    }
    return str.replace(/\0/g, "");
  }

  public async getToken(
    contractAddress: ContractAddress,
    transactionReceipt?: types.TransactionReceipt
  ): Promise<Token | null> {
    let tokenData: {
      symbol: string;
      decimals: number;
      name: string;
      l1Address?: string;
      type: TokenType;
    };

    const bridgeLog =
      transactionReceipt &&
      transactionReceipt.to &&
      transactionReceipt.to.toLowerCase() === this.blockchainService.bridgeAddresses.l2Erc20DefaultBridge &&
      transactionReceipt.logs?.find(
        (log) =>
          isLogOfType(log, [LogType.BridgeInitialization, LogType.BridgeInitialize]) &&
          log.address.toLowerCase() === contractAddress.address.toLowerCase()
      );

    if (bridgeLog) {
      const parsedLog = parseLog(CONTRACT_INTERFACES.L2_STANDARD_ERC20, bridgeLog);
      tokenData = {
        name: parsedLog.args.name,
        symbol: parsedLog.args.symbol,
        decimals: parsedLog.args.decimals,
        l1Address: parsedLog.args.l1Token,
        type: TokenType.ERC20,
      };
    } else {
      const stopGetTokenInfoDurationMetric = this.getTokenInfoDurationMetric.startTimer();
      tokenData = await this.getTokenData(contractAddress.address);
      if (tokenData) {
        stopGetTokenInfoDurationMetric();
      }
    }

    if (tokenData) {
      tokenData.symbol = this.removeSpecialChars(tokenData.symbol);
      tokenData.name = this.removeSpecialChars(tokenData.name);

      if (tokenData.symbol) {
        return {
          ...tokenData,
          blockNumber: contractAddress.blockNumber,
          transactionHash: contractAddress.transactionHash,
          l2Address: contractAddress.address,
          logIndex: contractAddress.logIndex,
          // add L1 address for ETH token
          ...(contractAddress.address.toLowerCase() === BASE_TOKEN_ADDRESS && {
            l1Address: ETH_L1_ADDRESS,
            type: TokenType.BaseToken,
          }),
        };
      }
    }

    return null;
  }
}
