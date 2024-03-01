import * as ethers from "zksync-web3";
import { NATIVE_TOKEN_L2_ADDRESS } from "../../common/constants";
import config from "../../config/index";
const { l1RpcProviderApiUrl, l2RpcProviderApiUrl } = config();
export async function fetchNativeTokenData() {
  const abi = [
    "function balanceOf(address owner) view returns (string)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
  ];
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
  const response = await fetch(l2RpcProviderApiUrl, requestOptions);
  const response_json = await response.json();
  const l1Address: string = response_json.result;
  if (isEthereum(l1Address) || (response_json.error && response_json.error.message === "Method not found")) {
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
    const provider = new ethers.Provider(l1RpcProviderApiUrl);
    const erc20_api = new ethers.Contract(l1Address, abi, provider);
    const symbol: string = await erc20_api.symbol();
    const decimals: number = await erc20_api.decimals();
    return {
      symbol,
      decimals,
      l1Address,
      l2Address,
      liquidity: 220000000000,
      iconURL: "",
      name: "",
      usdPrice: 1800,
    };
  }
}

function isEthereum(l1Address: string): boolean {
  return l1Address === "0x0000000000000000000000000000000000000001";
}
