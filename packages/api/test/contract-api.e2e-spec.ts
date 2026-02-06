import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { Repository } from "typeorm";
import nock from "nock";
import { Address } from "../src/address/address.entity";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";

const { CONTRACT_VERIFICATION_API_URL } = process.env;

describe("Contract API (e2e)", () => {
  let app: INestApplication;
  let addressRepository: Repository<Address>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build()],
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
    await addressRepository.createQueryBuilder().delete().execute();
    await app.close();
  });

  describe("/api?module=contract&action=getabi GET", () => {
    it("returns HTTP 200 and contract ABI when verification API returns the contract ABI", () => {
      const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/v2/contract/1/0xffffffffffffffffffffffffffffffffffffffff?fields=abi`)
        .reply(200, {
          abi: [],
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
        .get(`/v2/contract/1/0xffffffffffffffffffffffffffffffffffffffff?fields=abi`)
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
        .get(`/v2/contract/1/0xffffffffffffffffffffffffffffffffffffffff?fields=abi,sources,compilation,proxyResolution`)
        .reply(200, {
          abi: [],
          compilation: {
            compilerSettings: {
              optimizer: {
                enabled: true,
                runs: 200,
              },
            },
            language: "Solidity",
            fullyQualifiedName: "contractName",
            compilerVersion: "8.10.0",
          },
          sources: {
            "contracts/HelloWorld.sol": {
              content: "// SPDX-License-Identifier: UNLICENSED",
            },
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
                ConstructorArguments: "",
                ContractName: "contractName",
                EVMVersion: "Default",
                Implementation: "",
                Library: "",
                LicenseType: "",
                OptimizationUsed: "1",
                Proxy: "0",
                Runs: "200",
                SourceCode:
                  '{{"language":"Solidity","settings":{"optimizer":{"enabled":true,"runs":200}},"sources":{"contracts/HelloWorld.sol":{"content":"// SPDX-License-Identifier: UNLICENSED"}}}}',
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
        .get(`/v2/contract/1/0xffffffffffffffffffffffffffffffffffffffff?fields=abi,sources,compilation,proxyResolution`)
        .reply(200, {
          abi: [],
          compilation: {
            compilerSettings: {
              optimizer: {
                enabled: true,
                runs: 200,
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
            language: "Solidity",
            fullyQualifiedName: "contractName",
            compilerVersion: "8.10.0",
          },
          sources: {
            "@openzeppelin/contracts/access/Ownable.sol": {
              content: "Ownable.sol content",
            },
            "faucet.sol": {
              content: "faucet.sol content",
            },
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
                ConstructorArguments: "",
                ContractName: "contractName",
                EVMVersion: "Default",
                Implementation: "",
                Library:
                  "contracts/MiniMath.sol:MiniMath:0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913;contracts/MiniMath2.sol:MiniMath2:0x1c1cEFA394748048BE6b04Ea6081fE44B26a5914",
                LicenseType: "",
                OptimizationUsed: "1",
                Proxy: "0",
                Runs: "200",
                SourceCode:
                  '{{"language":"Solidity","settings":{"optimizer":{"enabled":true,"runs":200},"libraries":{"contracts/MiniMath.sol":{"MiniMath":"0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913"},"contracts/MiniMath2.sol":{"MiniMath2":"0x1c1cEFA394748048BE6b04Ea6081fE44B26a5914"}}},"sources":{"@openzeppelin/contracts/access/Ownable.sol":{"content":"Ownable.sol content"},"faucet.sol":{"content":"faucet.sol content"}}}}',
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
        .get(`/v2/contract/1/0xffffffffffffffffffffffffffffffffffffffff?fields=abi,sources,compilation,proxyResolution`)
        .reply(200, {
          abi: [],
          compilation: {
            compilerSettings: {
              optimize: true,
            },
            language: "Vyper",
            fullyQualifiedName: "contractName",
            compilerVersion: "v1.0.0",
          },
          sources: {
            "contracts/Greeter.vy": {
              content: "# @version ^0.3.3\n# vim: ft=python\n\ndef __init__():\n    pass",
            },
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
                CompilerVersion: "v1.0.0",
                ConstructorArguments: "",
                ContractName: "contractName",
                EVMVersion: "Default",
                Implementation: "",
                Library: "",
                LicenseType: "",
                OptimizationUsed: "1",
                Proxy: "0",
                Runs: "",
                SourceCode:
                  '{{"language":"Vyper","settings":{"optimize":true},"sources":{"contracts/Greeter.vy":{"content":"# @version ^0.3.3\\n# vim: ft=python\\n\\ndef __init__():\\n    pass"}}}}',
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
        .get(`/v2/contract/1/0xffffffffffffffffffffffffffffffffffffffff?fields=abi,sources,compilation,proxyResolution`)
        .reply(200, {
          abi: [],
          compilation: {
            compilerSettings: {
              optimize: true,
            },
            language: "Vyper",
            fullyQualifiedName: "contractName",
            compilerVersion: "v1.0.0",
          },
          sources: {
            contractName1: {
              content: "Content 1",
            },
            contractName2: {
              content: "Content 2",
            },
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
                CompilerVersion: "v1.0.0",
                ConstructorArguments: "",
                ContractName: "contractName",
                EVMVersion: "Default",
                Implementation: "",
                Library: "",
                LicenseType: "",
                OptimizationUsed: "1",
                Proxy: "0",
                Runs: "",
                SourceCode:
                  '{{"language":"Vyper","settings":{"optimize":true},"sources":{"contractName1":{"content":"Content 1"},"contractName2":{"content":"Content 2"}}}}',
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
        .get(`/v2/contract/1/0xffffffffffffffffffffffffffffffffffffffff?fields=abi,sources,compilation,proxyResolution`)
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
                Match: "",
                OptimizationUsed: "",
                Proxy: "0",
                Runs: "",
                SourceCode: "",
                SwarmSource: "",
                VerifiedAt: "",
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
        .post("/v2/verify/1/0x79eff59e5ae65d9876f1020b3ccab4027b49c2a2")
        .reply(200, { verificationId: 123 } as nock.Body);

      return request(app.getHttpServer())
        .post("/api")
        .send({
          module: "contract",
          action: "verifysourcecode",
          contractaddress: "0x79eff59e5ae65d9876f1020b3ccab4027b49c2a2",
          sourceCode: "// SPDX-License-Identifier: UNLICENSED",
          codeformat: "solidity-single-file",
          contractname: "contracts/HelloWorld.sol:HelloWorld",
          compilerversion: "0.8.17",
          optimizationUsed: "1",
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
        .post("/v2/verify/1/0x14174c76e073f8efef5c1fe0dd0f8c2ca9f21e62")
        .reply(200, { verificationId: 123 } as nock.Body);

      return request(app.getHttpServer())
        .post("/api")
        .send({
          module: "contract",
          action: "verifysourcecode",
          contractaddress: "0x14174c76E073f8efEf5C1FE0dd0f8c2Ca9F21e62",
          sourceCode: JSON.stringify({
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
          }),
          codeformat: "solidity-standard-json-input",
          contractname: "contracts/HelloWorldCtor.sol:HelloWorldCtor",
          compilerversion: "0.8.17",
          optimizationUsed: "1",
          constructorArguments: "0x94869207468657265210000000000000000000000000000000000000000000000",
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
        .post("/v2/verify/1/0xd60f82cf24eef908026b1920323ff586f328b3fe")
        .reply(200, { verificationId: 123 } as nock.Body);

      return request(app.getHttpServer())
        .post("/api")
        .send({
          module: "contract",
          action: "verifysourcecode",
          contractaddress: "0xD60F82CF24eEF908026B1920323FF586F328B3fe",
          sourceCode: JSON.stringify({
            language: "Vyper",
            settings: {
              optimize: true,
            },
            sources: {
              "contracts/Main.vy": {
                content: "// 1",
              },
              "contracts/MiniMath.vy": {
                content: "// 2",
              },
              "contracts/MiniMath2.vy": {
                content: "// 3",
              },
            },
          }),
          codeformat: "vyper-json",
          contractname: "contracts/Main.vy:Main",
          compilerversion: "0.1.0",
          optimizationUsed: "1",
          constructorArguments: "0x94869207468657265210000000000000000000000000000000000000000000000",
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
        .post("/v2/verify/1/0x79eff59e5ae65d9876f1020b3ccab4027b49c2a2")
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
      nock(CONTRACT_VERIFICATION_API_URL)
        .post("/v2/verify/1/0x79eff59e5ae65d9876f1020b3ccab4027b49c2a2")
        .reply(500, "Error");

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

      nock(CONTRACT_VERIFICATION_API_URL).get(`/v2/verify/${verificationId}`).reply(200, {
        isJobCompleted: true,
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

      nock(CONTRACT_VERIFICATION_API_URL).get(`/v2/verify/${verificationId}`).reply(200, {
        isJobCompleted: false,
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

    it("returns HTTP 200 and in progress failed status", () => {
      const verificationId = "1234";

      nock(CONTRACT_VERIFICATION_API_URL)
        .get(`/v2/verify/${verificationId}`)
        .reply(200, {
          error: { message: "ERROR! Compilation error." },
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
