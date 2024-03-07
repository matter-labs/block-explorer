import * as ethers from "zksync-web3";
import { NATIVE_TOKEN_L2_ADDRESS } from "../common/constants";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import { Logger, OnApplicationBootstrap, Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import config from "../config";
const { l1RpcProviderApiUrl, l2RpcProviderApiUrl } = config();
function isEthereum(l1Address: string): boolean {
  return l1Address === "0x0000000000000000000000000000000000000000";
}
type BaseTokenData = {
  symbol: string;
  decimals: number;
  l1Address: string;
  l2Address: string;
  liquidity: number;
  iconURL: string;
  name: string;
  usdPrice: number;
};
type BaseTokenRpcResponse = {
  result?: string;
  error?: {
    message: string;
  };
};
@Injectable()
export class BaseTokenService implements OnApplicationBootstrap {
  private l1Address: string;
  private l1ProviderUrl: string;
  private l2ProviderUrl: string;
  private baseToken: BaseTokenData;
  private readonly logger: Logger = new Logger(BaseTokenService.name);
  private readonly erc20ContractAbi = [
    "function balanceOf(address owner) view returns (string)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
  ];

  constructor(private httpService: HttpService) {
    this.l1ProviderUrl = l1RpcProviderApiUrl;
    this.l2ProviderUrl = l2RpcProviderApiUrl;
  }

  private async fetchL1BaseTokenAddress(): Promise<string> {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "zks_getBaseTokenL1Address",
        params: [],
        id: 1,
      }),
    };
    const { data } = await firstValueFrom(
      this.httpService.post<BaseTokenRpcResponse>(this.l2ProviderUrl, requestOptions).pipe(
        catchError((_error: AxiosError) => {
          this.logger.error("Could not reach hyperchain rpc provider");
          throw "Could not reach hyperchain rpc provider";
        })
      )
    );
    const l1Address: string = data.result;
    if (isEthereum(l1Address) || data.error) {
      this.logger.warn("The base token's l1 address is not an erc-20 contract, defaulting to ETH as base token");
      return "0x0000000000000000000000000000000000000000";
    }
    return l1Address;
  }
  private async initBaseTokenData(): Promise<BaseTokenData> {
    if (isEthereum(this.l1Address)) {
      return {
        l2Address: "0x0000000000000000000000000000000000000001",
        l1Address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        // Fallback data in case ETH token is not in the DB
        iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
        liquidity: 220000000000,
        usdPrice: 1800,
      };
    } else {
      const l2Address = NATIVE_TOKEN_L2_ADDRESS;
      const provider = new ethers.Provider(this.l1ProviderUrl);
      const erc20_api = new ethers.Contract(this.l1Address, this.erc20ContractAbi, provider);
      const symbol: string = await erc20_api.symbol();
      const decimals: number = await erc20_api.decimals();
      this.baseToken = {
        symbol,
        decimals,
        l1Address: this.l1Address,
        l2Address,
        liquidity: 220000000000,
        iconURL: "",
        name: "",
        usdPrice: 1800,
      };
    }
  }

  public async onApplicationBootstrap(): Promise<void> {
    this.l1Address = await this.fetchL1BaseTokenAddress();
    this.initBaseTokenData();
  }

  public baseTokenData(): BaseTokenData {
    return this.baseToken;
  }
}
