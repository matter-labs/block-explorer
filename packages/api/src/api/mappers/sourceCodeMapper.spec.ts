import { SOURCE_CODE_EMPTY_INFO, mapContractSourceCode } from "./sourceCodeMapper";
import { ContractVerificationInfo } from "../types";

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
      Match: "",
      VerifiedAt: "",
    });
  });
});

describe("mapContractSourceCode", () => {
  let verificationInfo: ContractVerificationInfo;

  beforeEach(() => {
    verificationInfo = {
      abi: [],
      sources: {
        fileName1: {
          content: "fileName1 content",
        },
        fileName2: {
          content: "fileName2 content",
        },
      },
      compilation: {
        language: "Solidity",
        compilerSettings: {
          optimizer: {
            enabled: true,
          },
        },
        compilerVersion: "0.8.17",
        fullyQualifiedName: "Greeter",
      },
      verifiedAt: "2023-07-24T10:36:11.121447608Z",
      match: "match",
    };
  });

  it("returns mapped source code for Solidity verification info", () => {
    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
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
      Match: "match",
      VerifiedAt: "2023-07-24T10:36:11.121447608Z",
    });
  });

  it("returns proper optimizer for Vyper json verification info with multiple files", () => {
    verificationInfo.compilation = {
      ...verificationInfo.compilation,
      ...{
        language: "Vyper",
        compilerVersion: "0.3.3",
        compilerSettings: {
          optimize: true,
        },
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.3.3",
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
        '{{"language":"Vyper","settings":{"optimize":true},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
      Match: "match",
      VerifiedAt: "2023-07-24T10:36:11.121447608Z",
    });
  });

  it("returns mapped source code for Vyper verification info", () => {
    verificationInfo.compilation = {
      ...verificationInfo.compilation,
      ...{
        language: "Vyper",
        compilerVersion: "0.3.3",
        compilerSettings: {
          optimize: true,
        },
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.3.3",
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
        '{{"language":"Vyper","settings":{"optimize":true},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
      Match: "match",
      VerifiedAt: "2023-07-24T10:36:11.121447608Z",
    });
  });

  it("returns OptimizationUsed depending on verification info", () => {
    verificationInfo.compilation = {
      ...verificationInfo.compilation,
      ...{
        compilerSettings: {
          optimizer: {
            enabled: false,
          },
        },
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
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
      Match: "match",
      VerifiedAt: "2023-07-24T10:36:11.121447608Z",
    });
  });

  it("returns Runs if specified", () => {
    verificationInfo.compilation = {
      ...verificationInfo.compilation,
      ...{
        compilerSettings: {
          optimizer: {
            enabled: true,
            runs: 500,
          },
        },
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
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
      Match: "match",
      VerifiedAt: "2023-07-24T10:36:11.121447608Z",
    });
  });

  it("returns empty Runs if there are no optimizer settings specified", () => {
    verificationInfo.compilation = {
      ...verificationInfo.compilation,
      ...{
        compilerSettings: {},
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
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
        '{{"language":"Solidity","settings":{},"sources":{"fileName1":{"content":"fileName1 content"},"fileName2":{"content":"fileName2 content"}}}}',
      SwarmSource: "",
      Match: "match",
      VerifiedAt: "2023-07-24T10:36:11.121447608Z",
    });
  });

  it("returns Library for single library specified", () => {
    verificationInfo.compilation = {
      ...verificationInfo.compilation,
      ...{
        compilerSettings: {
          ...verificationInfo.compilation.compilerSettings,
          libraries: {
            "contracts/MiniMath.sol": {
              MiniMath: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
            },
          },
        },
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
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
      Match: "match",
      VerifiedAt: "2023-07-24T10:36:11.121447608Z",
    });
  });

  it("returns Library for multiple libraries specified", () => {
    verificationInfo.compilation = {
      ...verificationInfo.compilation,
      ...{
        compilerSettings: {
          ...verificationInfo.compilation.compilerSettings,
          libraries: {
            "contracts/MiniMath.sol": {
              MiniMath: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
              MiniMath2: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5914",
            },
            "contracts/MaxiMath.sol": {
              MaxiMath: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5915",
              MaxiMath2: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5916",
            },
          },
        },
      },
    };

    expect(mapContractSourceCode(verificationInfo)).toEqual({
      ABI: "[]",
      CompilerVersion: "0.8.17",
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
      Match: "match",
      VerifiedAt: "2023-07-24T10:36:11.121447608Z",
    });
  });
});
