import * as ethers from "zksync-web3";


const erc20ContractAbi = [
    "function balanceOf(address owner) view returns (string)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
];
const baseTokenL1Address = process.env.BASE_TOKEN_L1_ADDRESS || "0x";
const l1RpcProviderApiUrl = process.env.ETH_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.Provider(l1RpcProviderApiUrl);
const erc20_api = new ethers.Contract(baseTokenL1Address, erc20ContractAbi, provider);
console.log("Base Token data:");
Promise
    .all([erc20_api.symbol(), erc20_api.decimals(), erc20_api.name()])
    .then(([symbol, decimals, name]) => {
        console.log("Symbol:", symbol);
        console.log("Decimals: ", decimals);
        console.log("Name: ", name);
    })
