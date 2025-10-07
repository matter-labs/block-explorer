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
  Logs = "logs",
  Token = "token",
  Stats = "stats",
}

export enum ApiAccountAction {
  TxList = "txlist",
  InternalTransactions = "txlistinternal",
  Balance = "balance",
  BalanceMulti = "balancemulti",
  TokenBalance = "tokenbalance",
  AddressTokenBalance = "addresstokenbalance",
  TokenTransfers = "tokentx",
  NFTTransfers = "tokennfttx",
  GetMinedBlocks = "getminedblocks",
}

export enum ApiContractAction {
  GetAbi = "getabi",
  GetSourceCode = "getsourcecode",
  GetContractCreation = "getcontractcreation",
  VerifySourceCode = "verifysourcecode",
  GetVerificationStatus = "checkverifystatus",
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

export enum ApiLogsAction {
  getLogs = "getLogs",
}

export enum ApiTokenAction {
  tokenInfo = "tokeninfo",
}

export enum ApiStatsAction {
  ethPrice = "ethprice",
}

export const apiActionsMap = {
  [ApiModule.Account]: Object.values(ApiAccountAction) as string[],
  [ApiModule.Contract]: Object.values(ApiContractAction) as string[],
  [ApiModule.Transaction]: Object.values(ApiTransactionAction) as string[],
  [ApiModule.Block]: Object.values(ApiBlockAction) as string[],
  [ApiModule.Logs]: Object.values(ApiLogsAction) as string[],
  [ApiModule.Token]: Object.values(ApiTokenAction) as string[],
  [ApiModule.Stats]: Object.values(ApiStatsAction) as string[],
};

type ContractFunctionInput = {
  internalType: string;
  name: string;
  type: string;
  value?: string | number;
};
type ContractFunctionOutput = {
  internalType: string;
  name: string;
  type: string;
};

export type AbiFragment = {
  inputs: ContractFunctionInput[];
  name: string;
  outputs: ContractFunctionOutput[];
  stateMutability: string;
  type: string;
};

export type ContractVerificationInfo = {
  abi: AbiFragment[];
  sources: {
    [key: string]: {
      content: string;
    };
  };
  compilation: {
    language: string;
    compilerSettings: {
      evmVersion?: string;
      libraries?: {
        [file: string]: {
          [library: string]: string;
        };
      };
      optimizer?: {
        enabled: boolean;
        runs?: number;
      };
      optimize?: string | boolean;
      [key: string]: unknown;
    };
    compilerVersion: string;
    fullyQualifiedName: string;
  };
  proxyResolution?: {
    isProxy: boolean;
    proxyType: string | null;
    implementations: { name: string; address: string }[];
  };
  verifiedAt: string;
  match: string;
};

export enum ContractVerificationCodeFormatEnum {
  soliditySingleFile = "solidity-single-file",
  solidityJsonInput = "solidity-standard-json-input",
  vyperJson = "vyper-json",
}

export type ContractVerificationStatusResponse = {
  isJobCompleted: boolean;
  error?: {
    message: string;
  };
};
