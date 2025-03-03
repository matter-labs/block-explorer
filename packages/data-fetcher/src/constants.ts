import { Interface } from "ethers";
import * as ethTokenAbi from "zksync-ethers/abi/IEthToken.json";
import * as erc20Abi from "zksync-ethers/abi/IERC20.json";
import * as l2SharedBridgeAbi from "zksync-ethers/abi/IL2SharedBridge.json";
import * as erc721Abi from "./abis/erc721.json";
import * as transferEventWithNoIndexesAbi from "./abis/transferEventWithNoIndexes.json";
import * as l2StandardERC20Abi from "./abis/l2StandardERC20.json";

export const ZERO_HASH_64 = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const BASE_TOKEN_ADDRESS = "0x000000000000000000000000000000000000800a";
export const ETH_L1_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CONTRACT_INTERFACES = {
  ERC20: {
    interface: new Interface(erc20Abi),
    abi: erc20Abi,
  },
  ERC721: {
    interface: new Interface(erc721Abi),
    abi: erc721Abi,
  },
  L2_STANDARD_ERC20: {
    interface: new Interface(l2StandardERC20Abi),
    abi: l2StandardERC20Abi,
  },
  TRANSFER_WITH_NO_INDEXES: {
    interface: new Interface(transferEventWithNoIndexesAbi),
    abi: transferEventWithNoIndexesAbi,
  },
  ETH_TOKEN: {
    interface: new Interface(ethTokenAbi),
    abi: ethTokenAbi,
  },
  L2_SHARED_BRIDGE: {
    interface: new Interface(l2SharedBridgeAbi),
    abi: l2SharedBridgeAbi,
  },
};
