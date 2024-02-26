import { utils } from "ethers";
import { abi as _ethTokenAbi } from "zksync-web3/abi/IEthToken.json";
import { abi as erc20Abi } from "zksync-web3/abi/IERC20.json";
import { abi as l2BridgeAbi } from "zksync-web3/abi/IL2Bridge.json";
import * as erc721Abi from "./abis/erc721.json";
import * as transferEventWithNoIndexesAbi from "./abis/transferEventWithNoIndexes.json";
import * as l2StandardERC20Abi from "./abis/l2StandardERC20.json";

export const ZERO_HASH_64 = "0x0000000000000000000000000000000000000000000000000000000000000000";
const ethTokenAbi = [
  ..._ethTokenAbi,
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_l2Sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_l1Receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "_additionalData",
        type: "bytes",
      },
    ],
    name: "WithdrawalWithMessage",
    type: "event",
  },
];
export const CONTRACT_INTERFACES = {
  ERC20: {
    interface: new utils.Interface(erc20Abi),
    abi: erc20Abi,
  },
  ERC721: {
    interface: new utils.Interface(erc721Abi),
    abi: erc721Abi,
  },
  L2_STANDARD_ERC20: {
    interface: new utils.Interface(l2StandardERC20Abi),
    abi: l2StandardERC20Abi,
  },
  TRANSFER_WITH_NO_INDEXES: {
    interface: new utils.Interface(transferEventWithNoIndexesAbi),
    abi: transferEventWithNoIndexesAbi,
  },
  ETH_TOKEN: {
    interface: new utils.Interface(ethTokenAbi),
    abi: ethTokenAbi,
  },
  L2_BRIDGE: {
    interface: new utils.Interface(l2BridgeAbi),
    abi: l2BridgeAbi,
  },
};
