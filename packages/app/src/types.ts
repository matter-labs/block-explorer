export type Hash = `0x${string}` | string;

export type Address = Hash;

export type NetworkOrigin = "L1" | "L2";

export enum ContractVerificationCodeFormatEnum {
  soliditySingleFile = "solidity-single-file",
  solidityMultiPart = "solidity-standard-json-input",
  vyperSingleFile = "vyper-multi-file",
  vyperMultiPart = "vyper-multi-file",
}

export type ContractVerificationCodeFormat =
  | ContractVerificationCodeFormatEnum.soliditySingleFile
  | ContractVerificationCodeFormatEnum.solidityMultiPart
  | ContractVerificationCodeFormatEnum.vyperSingleFile
  | ContractVerificationCodeFormatEnum.vyperMultiPart;

export enum CompilerEnum {
  solc = "solc",
  zksolc = "zksolc",
  vyper = "vyper",
  zkvyper = "zkvyper",
}

export enum CompilationTypeOptionsEnum {
  soliditySingleFile = "soliditySingleFile",
  solidityMultiPart = "solidityMultiPart",
  vyperSingleFile = "vyperSingleFile",
  vyperMultiPart = "vyperMultiPart",
}

export type Compiler = CompilerEnum.solc | CompilerEnum.zksolc | CompilerEnum.vyper | CompilerEnum.zkvyper;

export type ContractVerificationData = {
  codeFormat: ContractVerificationCodeFormat;
  contractAddress: string;
  contractName: string;
  optimizationUsed: boolean;
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
          optimizer: {
            enabled: boolean;
          };
        };
      };
  zkCompilerVersion: string;
  compilerVersion: string;
  constructorArguments: string;
};

export type ContractVerificationStatus = "successful" | "failed" | "in_progress" | "queued";
