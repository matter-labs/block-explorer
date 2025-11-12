export type Hash = `0x${string}` | string;

export type Address = Hash;

export type NetworkOrigin = "L1" | "L2";

export enum ContractVerificationCodeFormatEnum {
  soliditySingleFile = "solidity-single-file",
  solidityMultiPart = "solidity-standard-json-input",
  vyperJson = "vyper-json",
}

export type ContractVerificationCodeFormat =
  | ContractVerificationCodeFormatEnum.soliditySingleFile
  | ContractVerificationCodeFormatEnum.solidityMultiPart
  | ContractVerificationCodeFormatEnum.vyperJson;

export enum CompilerEnum {
  solc = "solc",
  vyper = "vyper",
}

export enum CompilationTypeOptionsEnum {
  soliditySingleFile = "soliditySingleFile",
  solidityMultiPart = "solidityMultiPart",
  vyperJson = "vyperJson",
}

export type Compiler = CompilerEnum.solc | CompilerEnum.vyper;

export type ContractVerificationData = {
  codeFormat: ContractVerificationCodeFormat;
  contractAddress: string;
  contractName: string;
  optimizationUsed: boolean;
  optimizerRuns: number;
  sourceCode:
    | string
    | {
        language: string;
        sources: {
          [key: string]: {
            content: string;
          };
        };
        settings: {
          optimizer?: {
            enabled: boolean;
            runs?: number;
          };
        };
      };
  evmVersion: string;
  compilerVersion: string;
  constructorArguments: string;
};

export type ContractVerificationStatus = "successful" | "failed" | "in_progress" | "queued";

export enum TimeFormat {
  TIME_AGO = "time_ago",
  FULL = "full",
  TIME_AGO_AND_FULL = "time_ago_and_full",
}
