import { Wallets } from "./entities";

export const localConfig = {
  gasLimit: { gasLimit: 8000000 },
  l2GasLimit: 8000000,
  L1Network: "http://localhost:8545",
  L2Network: "http://localhost:3050",
  privateKey: Wallets.richWalletPrivateKey,
  extendedTimeout: 1200 * 1000,
  standardTimeout: 60 * 1000,
  extendedPause: 20 * 1000,
  standardPause: 5 * 1000,
  minimalPause: 1 * 1000,
};

export const environment = {
  blockExplorerAPI: "http://localhost:3000",
};
