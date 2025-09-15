import { ContractVerificationInfo, SourceCodeData } from "../types";
import { ContractSourceCodeDto, VerifiedSource } from "../dtos/contract/contractSourceCodeResponse.dto";

export const SOURCE_CODE_EMPTY_INFO: ContractSourceCodeDto = {
  ABI: "Contract source code not verified",
  CompilerVersion: "",
  ConstructorArguments: "",
  ContractName: "",
  EVMVersion: "Default",
  Implementation: "",
  Library: "",
  LicenseType: "Unknown",
  OptimizationUsed: "",
  Proxy: "0",
  Runs: "",
  SourceCode: "",
  SwarmSource: "",
  CompilerSettings: "",
};

export const mapContractSourceCode = (data: ContractVerificationInfo): ContractSourceCodeDto => {
  let sourceCode: string;
  if (data.request.codeFormat.startsWith("vyper-multi-file") && typeof data.request.sourceCode !== "string") {
    const vyperFileNames = Object.keys(data.request.sourceCode);
    if (vyperFileNames.length === 1) {
      sourceCode = data.request.sourceCode[vyperFileNames[0]];
    } else {
      const mappedSourceCode = {
        language: "Vyper",
        settings: {
          optimizer: {
            enabled: data.request.optimizationUsed,
          },
        },
        sources: vyperFileNames.reduce<Record<string, { content: string }>>((sources, fileName) => {
          return { ...sources, ...{ [fileName]: { content: data.request.sourceCode[fileName] } } };
        }, {}),
      };
      sourceCode = `{${JSON.stringify(mappedSourceCode)}}`;
    }
  } else {
    sourceCode =
      typeof data.request.sourceCode === "string"
        ? data.request.sourceCode
        : `{${JSON.stringify(data.request.sourceCode)}}`;
  }

  let libraryString = "";
  let runs = "";

  const sourceCodeSettings = (data.request.sourceCode as SourceCodeData).settings;
  if (sourceCodeSettings) {
    runs = sourceCodeSettings.optimizer?.runs?.toString() || "";
    if (sourceCodeSettings.libraries) {
      const librariesMapping: string[] = [];
      for (const [fileName, contracts] of Object.entries(sourceCodeSettings.libraries)) {
        for (const [contractName, contractAddress] of Object.entries(contracts)) {
          librariesMapping.push(`${fileName}:${contractName}:${contractAddress}`);
        }
      }
      libraryString = librariesMapping.join(";");
    }
  }

  const zkCompilerVersion = data.request.compilerZksolcVersion || data.request.compilerZkvyperVersion;
  return {
    ABI: JSON.stringify(data.artifacts.abi),
    SourceCode: sourceCode,
    // remove leading 0x as Etherscan does
    ConstructorArguments: data.request.constructorArguments.startsWith("0x")
      ? data.request.constructorArguments.substring(2)
      : data.request.constructorArguments,
    ContractName: data.request.contractName,
    EVMVersion: "Default",
    OptimizationUsed: data.request.optimizationUsed ? "1" : "0",
    Library: libraryString,
    LicenseType: "",
    CompilerVersion: data.request.compilerSolcVersion || data.request.compilerVyperVersion,
    Runs: runs,
    SwarmSource: "",
    Proxy: "0",
    Implementation: "",
    ZkSolcVersion: zkCompilerVersion,
    // Deprecated fields, kept for backward compatibility
    ZkCompilerVersion: zkCompilerVersion,

    CompilerSettings: "",
  };
};

export const mapContractSourceCodeV2 = (data: VerifiedSource): ContractSourceCodeDto => {
  const sourceCode: string = JSON.stringify(data.sourceFiles);
  return {
    ABI: data.abi,
    SourceCode: sourceCode,
    // remove leading 0x as Etherscan does
    ConstructorArguments: data.constructorArguments?.startsWith("0x")
      ? data.constructorArguments.substring(2)
      : data.constructorArguments,
    ContractName: data.contractName,
    EVMVersion: "Default",
    OptimizationUsed: "0",
    Library: "",
    LicenseType: "",
    CompilerVersion: data.compilerVersion,
    Runs: "",
    SwarmSource: "",
    Proxy: "0",
    Implementation: "",

    CompilerSettings: data.compilerSettings,
  };
};
