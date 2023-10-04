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

  return {
    ...{
      ABI: JSON.stringify(data.artifacts.abi),
      SourceCode: sourceCode,
      // remove leading 0x as Etherscan does
      ConstructorArguments: data.request.constructorArguments.startsWith("0x")
        ? data.request.constructorArguments.substring(2)
        : data.request.constructorArguments,
      ContractName: data.request.contractName,
      EVMVersion: "Default",
      OptimizationUsed: data.request.optimizationUsed ? "1" : "0",
      Library: "",
      LicenseType: "",
      CompilerVersion: data.request.compilerSolcVersion || data.request.compilerVyperVersion,
      Runs: "",
      SwarmSource: "",
      Proxy: "0",
      Implementation: "",
    },
    ...(data.request.compilerZksolcVersion && {
      CompilerZksolcVersion: data.request.compilerZksolcVersion,
    }),
    ...(data.request.compilerZkvyperVersion && {
      CompilerZkvyperVersion: data.request.compilerZkvyperVersion,
    }),
  };
};
