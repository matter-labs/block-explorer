import { Interface } from "ethers";
import * as l2StandardERC20Abi from "./abis/l2StandardERC20.json";

export const ZERO_HASH_64 = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const BLOCKS_REVERT_DETECTED_EVENT = "revert:detected";

export const CONTRACT_INTERFACES = {
  L2_STANDARD_ERC20: {
    interface: new Interface(l2StandardERC20Abi),
    abi: l2StandardERC20Abi,
  },
};

// 127 is a L1 priority tx
// 126 is an upgrade tx
export const L1_ORIGINATED_TX_TYPES = [126, 127];

export const BASE_TOKEN_L2_ADDRESS = "0x000000000000000000000000000000000000800a";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS_IN_CONTRACTS = "0x0000000000000000000000000000000000000001";
