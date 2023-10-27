import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository } from "typeorm";
import * as nock from "nock";
import { Address } from "../src/address/address.entity";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";

const { CONTRACT_VERIFICATION_API_URL } = process.env;

describe("Contract API (e2e)", () => {
  let app: INestApplication;
  let addressRepository: Repository<Address>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();

    addressRepository = app.get<Repository<Address>>(getRepositoryToken(Address));

    await addressRepository.insert({
      bytecode: "0x",
      address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
      creatorAddress: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
      creatorTxHash: "0x37eeda3dd1b10afadfaba8e1896d9c513f527062cf04bb83f653c070c4725b7f",
    });
  });

  afterAll(async () => {
    await addressRepository.delete({});
    await app.close();
  });

  describe("/api?module=contract&action=getabi GET", () => {
    it("returns HTTP 200 and contract ABI when verification API returns the contract ABI", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/contract_verification/info/0xffffffffffffffffffffffffffffffffffffffff`)
        .reply(200, {
          artifacts: {
            abi: [],
          },
        });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getabi&address=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: "[]",
          })
        );
    });

    it("returns HTTP 200 and error result when verification API does not return the contract ABI", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/contract_verification/info/0xffffffffffffffffffffffffffffffffffffffff`)
        .reply(200, {});

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getabi&address=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "0",
            message: "NOTOK",
            result: "Contract source code not verified",
          })
        );
    });
  });

  describe("/api?module=contract&action=getsourcecode GET", () => {
    it("returns HTTP 200 and contract source code for verified single file Solidity contract", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/contract_verification/info/0xffffffffffffffffffffffffffffffffffffffff`)
        .reply(200, {
          artifacts: {
            abi: [],
          },
          request: {
            codeFormat: "solidity-single-file",
            sourceCode: "sourceCode",
            constructorArguments: "0x0001",
            contractName: "contractName",
            optimizationUsed: true,
            compilerSolcVersion: "8.10.0",
            compilerZksolcVersion: "10.0.0",
          },
        });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getsourcecode&address=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                ABI: "[]",
                CompilerVersion: "8.10.0",
                ZkCompilerVersion: "10.0.0",
                ConstructorArguments: "0001",
                ContractName: "contractName",
                EVMVersion: "Default",
                Implementation: "",
                Library: "",
                LicenseType: "",
                OptimizationUsed: "1",
                Proxy: "0",
                Runs: "",
                SourceCode: "sourceCode",
                SwarmSource: "",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and contract source code for verified multi file Solidity contract", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/contract_verification/info/0xffffffffffffffffffffffffffffffffffffffff`)
        .reply(200, {
          artifacts: {
            abi: [],
          },
          request: {
            codeFormat: "solidity-standard-json-input",
            sourceCode: {
              language: "Solidity",
              settings: {
                optimizer: {
                  enabled: true,
                },
                libraries: {
                  "contracts/MiniMath.sol": {
                    MiniMath: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
                  },
                  "contracts/MiniMath2.sol": {
                    MiniMath2: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5914",
                  },
                },
              },
              sources: {
                "@openzeppelin/contracts/access/Ownable.sol": {
                  content: "Ownable.sol content",
                },
                "faucet.sol": {
                  content: "faucet.sol content",
                },
              },
            },
            constructorArguments: "0x0001",
            contractName: "contractName",
            optimizationUsed: true,
            compilerSolcVersion: "8.10.0",
            compilerZksolcVersion: "10.0.0",
          },
        });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getsourcecode&address=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                ABI: "[]",
                CompilerVersion: "8.10.0",
                ZkCompilerVersion: "10.0.0",
                ConstructorArguments: "0001",
                ContractName: "contractName",
                EVMVersion: "Default",
                Implementation: "",
                Library:
                  "contracts/MiniMath.sol:MiniMath:0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913;contracts/MiniMath2.sol:MiniMath2:0x1c1cEFA394748048BE6b04Ea6081fE44B26a5914",
                LicenseType: "",
                OptimizationUsed: "1",
                Proxy: "0",
                Runs: "",
                SourceCode:
                  '{{"language":"Solidity","settings":{"optimizer":{"enabled":true},"libraries":{"contracts/MiniMath.sol":{"MiniMath":"0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913"},"contracts/MiniMath2.sol":{"MiniMath2":"0x1c1cEFA394748048BE6b04Ea6081fE44B26a5914"}}},"sources":{"@openzeppelin/contracts/access/Ownable.sol":{"content":"Ownable.sol content"},"faucet.sol":{"content":"faucet.sol content"}}}}',
                SwarmSource: "",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and contract source code for verified single file Vyper contract", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/contract_verification/info/0xffffffffffffffffffffffffffffffffffffffff`)
        .reply(200, {
          artifacts: {
            abi: [],
          },
          request: {
            codeFormat: "vyper-multi-file",
            sourceCode: {
              "Base.vy": "Base.vy content",
            },
            constructorArguments: "0x0001",
            contractName: "contractName",
            optimizationUsed: true,
            compilerVyperVersion: "9.10.0",
            compilerZkvyperVersion: "11.0.0",
          },
        });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getsourcecode&address=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                ABI: "[]",
                CompilerVersion: "9.10.0",
                ZkCompilerVersion: "11.0.0",
                ConstructorArguments: "0001",
                ContractName: "contractName",
                EVMVersion: "Default",
                Implementation: "",
                Library: "",
                LicenseType: "",
                OptimizationUsed: "1",
                Proxy: "0",
                Runs: "",
                SourceCode: "Base.vy content",
                SwarmSource: "",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and contract source code for verified multi file Vyper contract", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/contract_verification/info/0xffffffffffffffffffffffffffffffffffffffff`)
        .reply(200, {
          artifacts: {
            abi: [],
          },
          request: {
            codeFormat: "vyper-multi-file",
            sourceCode: {
              "Base.vy": "Base.vy content",
              "faucet.vy": "faucet.vy content",
            },
            constructorArguments: "0x0001",
            contractName: "contractName",
            optimizationUsed: true,
            compilerVyperVersion: "9.10.0",
            compilerZkvyperVersion: "11.0.0",
          },
        });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getsourcecode&address=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                ABI: "[]",
                CompilerVersion: "9.10.0",
                ZkCompilerVersion: "11.0.0",
                ConstructorArguments: "0001",
                ContractName: "contractName",
                EVMVersion: "Default",
                Implementation: "",
                Library: "",
                LicenseType: "",
                OptimizationUsed: "1",
                Proxy: "0",
                Runs: "",
                SourceCode:
                  '{{"language":"Vyper","settings":{"optimizer":{"enabled":true}},"sources":{"Base.vy":{"content":"Base.vy content"},"faucet.vy":{"content":"faucet.vy content"}}}}',
                SwarmSource: "",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and empty result when verification API does not return the contract source code", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/contract_verification/info/0xffffffffffffffffffffffffffffffffffffffff`)
        .reply(404, {});

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getsourcecode&address=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
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
              },
            ],
            status: "1",
          })
        );
    });
  });

  describe("/api POST", () => {
    it("returns HTTP 200 and contract verification id for single file Solidity contract", () => {
      nock(CONTRACT_VERIFICATION_API_URL)
        .post("/contract_verification")
        .reply(200, 123 as unknown as nock.Body);

      return request(app.getHttpServer())
        .post("/api")
        .send({
          module: "contract",
          action: "verifysourcecode",
          contractaddress: "0x79efF59e5ae65D9876F1020b3cCAb4027B49c2a2",
          sourceCode: "// SPDX-License-Identifier: UNLICENSED",
          codeformat: "solidity-single-file",
          contractname: "contracts/HelloWorld.sol:HelloWorld",
          compilerversion: "0.8.17",
          optimizationUsed: "1",
          zkCompilerVersion: "v1.3.14",
        })
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "123",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and contract verification id for multi file Solidity contract", () => {
      nock(CONTRACT_VERIFICATION_API_URL)
        .post("/contract_verification")
        .reply(200, 123 as unknown as nock.Body);

      return request(app.getHttpServer())
        .post("/api")
        .send({
          module: "contract",
          action: "verifysourcecode",
          contractaddress: "0x14174c76E073f8efEf5C1FE0dd0f8c2Ca9F21e62",
          sourceCode: {
            language: "Solidity",
            settings: {
              optimizer: {
                enabled: true,
              },
            },
            sources: {
              "contracts/HelloWorldCtor.sol": {
                content: "// SPDX-License-Identifier: UNLICENSED",
              },
            },
          },
          codeformat: "solidity-standard-json-input",
          contractname: "contracts/HelloWorldCtor.sol:HelloWorldCtor",
          compilerversion: "0.8.17",
          optimizationUsed: "1",
          zkCompilerVersion: "v1.3.14",
          constructorArguements: "0x94869207468657265210000000000000000000000000000000000000000000000",
          runs: 700,
        })
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "123",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and contract verification id for multi file Vyper contract", () => {
      nock(CONTRACT_VERIFICATION_API_URL)
        .post("/contract_verification")
        .reply(200, 123 as unknown as nock.Body);

      return request(app.getHttpServer())
        .post("/api")
        .send({
          module: "contract",
          action: "verifysourcecode",
          contractaddress: "0xD60F82CF24eEF908026B1920323FF586F328B3fe",
          sourceCode: {
            language: "Solidity",
            settings: {
              optimizer: {
                enabled: true,
              },
            },
            sources: {
              "contracts/Main.sol": {
                content: "// SPDX-License-Identifier 1",
              },
              "contracts/MiniMath.sol": {
                content: "// SPDX-License-Identifier 2",
              },
              "contracts/MiniMath2.sol": {
                content: "// SPDX-License-Identifier 3",
              },
            },
          },
          codeformat: "solidity-standard-json-input",
          contractname: "contracts/Main.sol:Main",
          compilerversion: "0.8.17",
          optimizationUsed: "1",
          zkCompilerVersion: "v1.3.14",
          constructorArguements: "0x94869207468657265210000000000000000000000000000000000000000000000",
          runs: 600,
          libraryname1: "contracts/MiniMath.sol:MiniMath",
          libraryaddress1: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
          libraryname2: "contracts/MiniMath2.sol:MiniMath2",
          libraryaddress2: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
        })
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "123",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 with NOTOK result and validation message for 400 verification response", () => {
      nock(CONTRACT_VERIFICATION_API_URL)
        .post("/contract_verification")
        .reply(400, "Contract has been already verified");

      return request(app.getHttpServer())
        .post("/api")
        .send({
          module: "contract",
          action: "verifysourcecode",
          contractaddress: "0x79efF59e5ae65D9876F1020b3cCAb4027B49c2a2",
          sourceCode: "// SPDX-License-Identifier: UNLICENSED",
          codeformat: "solidity-single-file",
          contractname: "contracts/HelloWorld.sol:HelloWorld",
          compilerversion: "0.8.17",
          optimizationUsed: "1",
          zkCompilerVersion: "v1.3.14",
        })
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "Contract has been already verified",
            status: "0",
          })
        );
    });

    it("returns HTTP 200 with NOTOK and a generic error message for non 400 verification response", () => {
      nock(CONTRACT_VERIFICATION_API_URL).post("/contract_verification").reply(500, "Error");

      return request(app.getHttpServer())
        .post("/api")
        .send({
          module: "contract",
          action: "verifysourcecode",
          contractaddress: "0x79efF59e5ae65D9876F1020b3cCAb4027B49c2a2",
          sourceCode: "// SPDX-License-Identifier: UNLICENSED",
          codeformat: "solidity-single-file",
          contractname: "contracts/HelloWorld.sol:HelloWorld",
          compilerversion: "0.8.17",
          optimizationUsed: "1",
          zkCompilerVersion: "v1.3.14",
        })
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "Failed to send verification request",
            status: "0",
          })
        );
    });
  });

  describe("/api?module=contract&action=checkverifystatus GET", () => {
    it("returns HTTP 200 and successful verification status", () => {
      const verificationId = "1234";

      nock(CONTRACT_VERIFICATION_API_URL).get(`/contract_verification/${verificationId}`).reply(200, {
        status: "successful",
      });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=checkverifystatus&guid=${verificationId}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "Pass - Verified",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and queued verification status", () => {
      const verificationId = "1234";

      nock(CONTRACT_VERIFICATION_API_URL).get(`/contract_verification/${verificationId}`).reply(200, {
        status: "queued",
      });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=checkverifystatus&guid=${verificationId}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "Pending in queue",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and in progress verification status", () => {
      const verificationId = "1234";

      nock(CONTRACT_VERIFICATION_API_URL).get(`/contract_verification/${verificationId}`).reply(200, {
        status: "in_progress",
      });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=checkverifystatus&guid=${verificationId}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "In progress",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and in progress failed status", () => {
      const verificationId = "1234";

      nock(CONTRACT_VERIFICATION_API_URL).get(`/contract_verification/${verificationId}`).reply(200, {
        status: "failed",
        error: "ERROR! Compilation error.",
      });

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=checkverifystatus&guid=${verificationId}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "ERROR! Compilation error.",
            status: "0",
          })
        );
    });

    it("returns HTTP 200 and not OK if verification id is not valid", () => {
      return request(app.getHttpServer())
        .get(`/api?module=contract&action=checkverifystatus`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "Verification ID is not specified",
            status: "0",
          })
        );
    });
  });

  describe("/api?module=contract&action=getcontractcreation GET", () => {
    it("returns HTTP 200 and contract creation info when contract is found in DB", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      return request(app.getHttpServer())
        .get(`/api?module=contract&action=getcontractcreation&contractaddresses=${address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: [
              {
                contractAddress: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
                contractCreator: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
                txHash: "0x37eeda3dd1b10afadfaba8e1896d9c513f527062cf04bb83f653c070c4725b7f",
              },
            ],
          })
        );
    });

    it("returns HTTP 200 and error result when no contracts found in DB", () => {
      return request(app.getHttpServer())
        .get(
          "/api?module=contract&action=getcontractcreation&contractaddresses=0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA,0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFB"
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "0",
            message: "No data found",
            result: null,
          })
        );
    });
  });
});
