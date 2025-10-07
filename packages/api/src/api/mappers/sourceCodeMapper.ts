import { ContractVerificationInfo } from "../types";
import { ContractSourceCodeDto } from "../dtos/contract/contractSourceCodeResponse.dto";

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
  VerifiedAt: "",
  Match: "",
};

export const mapContractSourceCode = (data: ContractVerificationInfo): ContractSourceCodeDto => {
  let libraryString = "";
  const librariesMapping: string[] = [];
  if (data.compilation.compilerSettings.libraries) {
    for (const [fileName, contracts] of Object.entries(data.compilation.compilerSettings.libraries)) {
      for (const [contractName, contractAddress] of Object.entries(contracts)) {
        librariesMapping.push(`${fileName}:${contractName}:${contractAddress}`);
      }
    }
    libraryString = librariesMapping.join(";");
  }

  return {
    ABI: JSON.stringify(data.abi),
    SourceCode: JSON.stringify({
      language: data.compilation.language,
      settings: data.compilation.compilerSettings,
      sources: data.sources,
    }),
    // TODO: manually extract constructor args as sourcify doesn't have them
    ConstructorArguments: "",
    ContractName: data.compilation.fullyQualifiedName,
    EVMVersion: data.compilation.compilerSettings.evmVersion || "Default",
    OptimizationUsed:
      data.compilation.compilerSettings.optimizer?.enabled || data.compilation.compilerSettings.optimize ? "1" : "0",
    Library: libraryString,
    LicenseType: "",
    CompilerVersion: data.compilation.compilerVersion,
    Runs: data.compilation.compilerSettings.optimizer?.runs?.toString() || "",
    SwarmSource: "",
    Proxy: data.proxyResolution?.isProxy ? "1" : "0",
    Implementation: data.proxyResolution?.implementations.length
      ? data.proxyResolution.implementations[data.proxyResolution.implementations.length - 1].address
      : "",
    VerifiedAt: data.verifiedAt,
    Match: data.match,
  };
};
