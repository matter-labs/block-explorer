export type ApiRequestQuery = {
  module: ApiModule;
  action: string;
  [key: string]: string;
};

export enum ApiModule {
  Account = "account",
  Contract = "contract",
  Transaction = "transaction",
  Block = "block",
}

export enum ApiAccountAction {
  TxList = "txlist",
  InternalTransactions = "txlistinternal",
  Balance = "balance",
  BalanceMulti = "balancemulti",
  TokenBalance = "tokenbalance",
  TokenTransfers = "tokentx",
  NFTTransfers = "tokennfttx",
}

export enum ApiContractAction {
  GetAbi = "getabi",
  GetContractCreation = "getcontractcreation",
}

export enum ApiTransactionAction {
  GetStatus = "getstatus",
  GetTxReceiptStatus = "gettxreceiptstatus",
}

export enum ApiBlockAction {
  GetBlockNumberByTimestamp = "getblocknobytime",
  GetBlockCountdown = "getblockcountdown",
  GetBlockRewards = "getblockreward",
}

export const apiActionsMap = {
  [ApiModule.Account]: Object.values(ApiAccountAction) as string[],
  [ApiModule.Contract]: Object.values(ApiContractAction) as string[],
  [ApiModule.Transaction]: Object.values(ApiTransactionAction) as string[],
  [ApiModule.Block]: Object.values(ApiBlockAction) as string[],
};
