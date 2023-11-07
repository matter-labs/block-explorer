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

export type SourceCodeData = {
  language: string;
  settings: {
    optimizer?: {
      enabled: boolean;
      runs?: number;
    };
    libraries?: {
      [file: string]: {
        [library: string]: string;
      };
    };
  };
  sources: {
    [key: string]: {
      content: string;
    };
  };
};

type ContractVerificationRequest = {
  id: number;
  codeFormat: string;
  contractName: string;
  contractAddress: string;
  compilerSolcVersion?: string;
  compilerZksolcVersion?: string;
  compilerVyperVersion?: string;
  compilerZkvyperVersion?: string;
  constructorArguments: string;
  sourceCode: string | SourceCodeData | Record<string, string>;
  optimizationUsed: boolean;
};

export type ContractVerificationInfo = {
  artifacts: {
    abi: AbiFragment[];
    bytecode: number[];
  };
  request: ContractVerificationRequest;
  verifiedAt: string;
};

export enum ContractVerificationCodeFormatEnum {
  soliditySingleFile = "solidity-single-file",
  solidityJsonInput = "solidity-standard-json-input",
  vyperMultiFile = "vyper-multi-file",
}

export type ContractVerificationStatusResponse = {
  status: "successful" | "failed" | "in_progress" | "queued";
  error?: string;
};
