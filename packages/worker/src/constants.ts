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
