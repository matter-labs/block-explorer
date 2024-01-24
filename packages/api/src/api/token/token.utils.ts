import { NativeERC20 } from "../dtos/token/tokenInfo.dto";
import * as ethers from "zksync-web3";
export async function fetch_native_erc20_info(): Promise<NativeERC20> {
  const abi = [
    "function balanceOf(address owner) view returns (string)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
  ];
  const gethUrl = "http://localhost:8545";
  const url = "http://127.0.0.1:3050";
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "zks_getNativeTokenAddress",
      params: [],
      id: 1,
    }),
  };

  const response = await fetch(url, requestOptions);
  const response_json = await response.json();
  const l1Address: string = response_json.result;
  const l2Address = "0x0000000000000000000000000000000000000000";
  const provider = new ethers.Provider(gethUrl);
  const erc20_api = new ethers.Contract(l1Address, abi, provider);
  const symbol: string = await erc20_api.symbol();
  const decimals: string = await erc20_api.decimals();
  return {
    symbol,
    decimals,
    l1Address,
    l2Address,
  };
}
