import { Wallets } from "./entities";

export const localConfig = {
  gasLimit: { gasLimit: 10000000 },
  l2GasLimit: 10000000,
  L1Network: "http://localhost:8545",
  L2Network: "http://localhost:3050",
  privateKey: Wallets.richWalletPrivateKey,
  extendedTimeout: 1200 * 1000,
  standardTimeout: 60 * 1000,
  extendedPause: 20 * 1000,
  standardPause: 5 * 1000,
  minimalPause: 0.5 * 1000,
  maxAPIretries: 200,
  intervalAPIretries: 0.2 * 1000,
};

export const environment = {
  blockExplorerAPI: "http://localhost:3020",
};
