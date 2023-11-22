import { SOURCE_CODE_EMPTY_INFO, mapContractSourceCode } from "./sourceCodeMapper";
import { ContractVerificationInfo, SourceCodeData } from "../types";

describe("SOURCE_CODE_EMPTY_INFO", () => {
  it("returns ContractSourceCodeDto with empty or default values", () => {
    expect(SOURCE_CODE_EMPTY_INFO).toEqual({
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
    });
  });
});

describe("mapContractSourceCode", () => {
  let verificationInfo: ContractVerificationInfo;

  beforeEach(() => {
    verificationInfo = {
      artifacts: {
        abi: [],
        bytecode: [0, 2, 0],
      },
      request: {
        id: 33877,
        contractAddress: "0x000000000000000000000000000000000000800a",
        codeFormat: "solidity-multi-file",
        compilerSolcVersion: "0.8.17",
        compilerZksolcVersion: "v1.3.9",
        constructorArguments: "0x",
        contractName: "Greeter",
        optimizationUsed: true,
        sourceCode: {
          language: "Solidity",
          settings: {
            optimizer: {
              enabled: true,
            },
          },
          sources: {
            fileName1: {
              content: "fileName1 content",
            },
            fileName2: {
              content: "fileName2 content",
            },
          },
        },
      },
      verifiedAt: "2023-07-24T10:36:11.121447608Z",
    };
  });

  it("returns mapped source code for Solidity multi file verification info", () => {
    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "",
      LicenseType: "",
      OptimizationUsed: "1",
      Proxy: "0",
      Runs: "",
      SourceCode:
        '{{"language":"Solidity","settings":{"optimizer":{"enabled":true}},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
    });
  });

  it("returns mapped source code for Solidity single file verification info", () => {
    verificationInfo.request = {
      ...verificationInfo.request,
      ...{
        codeFormat: "solidity-single-file",
        sourceCode: "// source code",
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "",
      LicenseType: "",
      OptimizationUsed: "1",
      Proxy: "0",
      Runs: "",
      SourceCode: "// source code",
      SwarmSource: "",
    });
  });

  it("returns mapped source code for Vyper multi file verification info with multiple files", () => {
    verificationInfo.request = {
      ...verificationInfo.request,
      ...{
        codeFormat: "vyper-multi-file",
        compilerSolcVersion: undefined,
        compilerZksolcVersion: undefined,
        compilerVyperVersion: "0.3.3",
        compilerZkvyperVersion: "v1.3.9",
        sourceCode: {
          fileName1: "fileName1 content",
          fileName2: "fileName2 content",
        },
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.3.3",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "",
      LicenseType: "",
      OptimizationUsed: "1",
      Proxy: "0",
      Runs: "",
      SourceCode:
        '{{"language":"Vyper","settings":{"optimizer":{"enabled":true}},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
    });
  });

  it("returns proper optimizer for Vyper multi file verification info with multiple files", () => {
    verificationInfo.request = {
      ...verificationInfo.request,
      ...{
        codeFormat: "vyper-multi-file",
        compilerSolcVersion: undefined,
        compilerZksolcVersion: undefined,
        compilerVyperVersion: "0.3.3",
        compilerZkvyperVersion: "v1.3.9",
        sourceCode: {
          fileName1: "fileName1 content",
          fileName2: "fileName2 content",
        },
        optimizationUsed: false,
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.3.3",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "",
      LicenseType: "",
      OptimizationUsed: "0",
      Proxy: "0",
      Runs: "",
      SourceCode:
        '{{"language":"Vyper","settings":{"optimizer":{"enabled":false}},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
    });
  });

  it("returns mapped source code for Vyper multi file verification info with single file", () => {
    verificationInfo.request = {
      ...verificationInfo.request,
      ...{
        codeFormat: "vyper-multi-file",
        compilerSolcVersion: undefined,
        compilerZksolcVersion: undefined,
        compilerVyperVersion: "0.3.3",
        compilerZkvyperVersion: "v1.3.9",
        sourceCode: {
          fileName1: "fileName1 content",
        },
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.3.3",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "",
      LicenseType: "",
      OptimizationUsed: "1",
      Proxy: "0",
      Runs: "",
      SourceCode: "fileName1 content",
      SwarmSource: "",
    });
  });

  it("returns contructor arguments without 0x", () => {
    verificationInfo.request = {
      ...verificationInfo.request,
      ...{
        constructorArguments: "123",
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "123",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "",
      LicenseType: "",
      OptimizationUsed: "1",
      Proxy: "0",
      Runs: "",
      SourceCode:
        '{{"language":"Solidity","settings":{"optimizer":{"enabled":true}},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
    });
  });

  it("returns OptimizationUsed depending on verification info", () => {
    verificationInfo.request = {
      ...verificationInfo.request,
      ...{
        optimizationUsed: false,
      },
    };
    (verificationInfo.request.sourceCode as SourceCodeData).settings.optimizer.enabled = false;

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "",
      LicenseType: "",
      OptimizationUsed: "0",
      Proxy: "0",
      Runs: "",
      SourceCode:
        '{{"language":"Solidity","settings":{"optimizer":{"enabled":false}},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
    });
  });

  it("returns Runs if specified", () => {
    (verificationInfo.request.sourceCode as SourceCodeData).settings.optimizer.runs = 500;

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "",
      LicenseType: "",
      OptimizationUsed: "1",
      Proxy: "0",
      Runs: "500",
      SourceCode:
        '{{"language":"Solidity","settings":{"optimizer":{"enabled":true,"runs":500}},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
    });
  });

  it("returns empty Runs if there are no optimizer settings specified", () => {
    (verificationInfo.request.sourceCode as SourceCodeData).settings.optimizer = undefined;

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "",
      LicenseType: "",
      OptimizationUsed: "1",
      Proxy: "0",
      Runs: "",
      SourceCode:
        '{{"language":"Solidity","settings":{},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
    });
  });

  it("returns Library for single library specified", () => {
    (verificationInfo.request.sourceCode as SourceCodeData).settings.libraries = {
      "contracts/MiniMath.sol": {
        MiniMath: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library: "contracts/MiniMath.sol:MiniMath:0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
      LicenseType: "",
      OptimizationUsed: "1",
      Proxy: "0",
      Runs: "",
      SourceCode:
        '{{"language":"Solidity","settings":{"optimizer":{"enabled":true},"libraries":{"contracts/MiniMath.sol":{"MiniMath":"0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913"}}},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
    });
  });

  it("returns Library for multiple libraries specified", () => {
    (verificationInfo.request.sourceCode as SourceCodeData).settings.libraries = {
      "contracts/MiniMath.sol": {
        MiniMath: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
        MiniMath2: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5914",
      },
      "contracts/MaxiMath.sol": {
        MaxiMath: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5915",
        MaxiMath2: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5916",
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
      ZkCompilerVersion: "v1.3.9",
      ConstructorArguments: "",
      ContractName: "Greeter",
      EVMVersion: "Default",
      Implementation: "",
      Library:
        "contracts/MiniMath.sol:MiniMath:0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913;contracts/MiniMath.sol:MiniMath2:0x1c1cEFA394748048BE6b04Ea6081fE44B26a5914;contracts/MaxiMath.sol:MaxiMath:0x1c1cEFA394748048BE6b04Ea6081fE44B26a5915;contracts/MaxiMath.sol:MaxiMath2:0x1c1cEFA394748048BE6b04Ea6081fE44B26a5916",
      LicenseType: "",
      OptimizationUsed: "1",
      Proxy: "0",
      Runs: "",
      SourceCode:
        '{{"language":"Solidity","settings":{"optimizer":{"enabled":true},"libraries":{"contracts/MiniMath.sol":{"MiniMath":"0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913","MiniMath2":"0x1c1cEFA394748048BE6b04Ea6081fE44B26a5914"},"contracts/MaxiMath.sol":{"MaxiMath":"0x1c1cEFA394748048BE6b04Ea6081fE44B26a5915","MaxiMath2":"0x1c1cEFA394748048BE6b04Ea6081fE44B26a5916"}}},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
    });
  });
});
