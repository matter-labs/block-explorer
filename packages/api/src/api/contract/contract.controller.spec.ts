import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AxiosResponse, AxiosError } from "axios";
import * as rxjs from "rxjs";
import { AddressService } from "../../address/address.service";
import { Address } from "../../address/address.entity";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { ContractController, parseAddressListPipeExceptionFactory } from "./contract.controller";

describe("ContractController", () => {
  let controller: ContractController;
  let addressServiceMock: AddressService;
  let httpServiceMock: HttpService;
  let configServiceMock: ConfigService;

  const address = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

  beforeEach(async () => {
    addressServiceMock = mock<AddressService>({
      findByAddresses: jest.fn().mockResolvedValue([]),
    });
    httpServiceMock = mock<HttpService>();
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue("http://verification.api"),
    });
    const module = await Test.createTestingModule({
      controllers: [ContractController],
      providers: [
        {
          provide: AddressService,
          useValue: addressServiceMock,
        },
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    controller = module.get<ContractController>(ContractController);
  });

  describe("getContractAbi", () => {
    let pipeMock = jest.fn();

    beforeEach(() => {
      pipeMock = jest.fn();
      jest.spyOn(httpServiceMock, "get").mockReturnValue({
        pipe: pipeMock,
      } as unknown as rxjs.Observable<AxiosResponse>);
      jest.spyOn(rxjs, "catchError").mockImplementation((callback) => callback as any);
    });

    it("throws error when contract verification info API fails with response status different to 404", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
          response: {
            data: "response data",
            status: 500,
          },
        } as AxiosError);
      });

      await expect(controller.getContractAbi(address)).rejects.toThrowError(
        new InternalServerErrorException("Failed to get contract ABI")
      );
    });

    it("throws error when contract verification info API fails with response status 404", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
          response: {
            data: "response data",
            status: 404,
          },
        } as AxiosError);
      });

      await expect(controller.getContractAbi(address)).rejects.toThrowError(
        new InternalServerErrorException("Contract source code not verified")
      );
    });

    it("throws error when contract verification info API fails without response data", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
        } as AxiosError);
      });

      await expect(controller.getContractAbi(address)).rejects.toThrowError(
        new InternalServerErrorException("Failed to get contract ABI")
      );
    });

    it("throws error when contract verification info does not contain abi", async () => {
      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {},
          });
        })
      );

      await expect(controller.getContractAbi(address)).rejects.toThrowError(
        new InternalServerErrorException("Contract source code not verified")
      );
    });

    it("returns contract ABI from verification info API", async () => {
      const abi = [];

      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              artifacts: {
                abi,
              },
            },
          });
        })
      );

      const response = await controller.getContractAbi(address);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: JSON.stringify(abi),
      });
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/info/${address}`);
    });
  });

  describe("getContractSourceCode", () => {
    let pipeMock = jest.fn();

    beforeEach(() => {
      pipeMock = jest.fn();
      jest.spyOn(httpServiceMock, "get").mockReturnValue({
        pipe: pipeMock,
      } as unknown as rxjs.Observable<AxiosResponse>);
      jest.spyOn(rxjs, "catchError").mockImplementation((callback) => callback as any);
    });

    it("throws error when contract verification info API fails with a server error", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
          response: {
            data: "response data",
            status: 500,
          },
        } as AxiosError);
      });

      await expect(controller.getContractSourceCode(address)).rejects.toThrowError(
        new InternalServerErrorException("Failed to get contract source code")
      );
    });

    it("returns empty source code when response API fails with with no data", async () => {
      pipeMock.mockImplementation((callback) => {
        return callback({
          stack: "error stack",
        } as AxiosError);
      });

      const response = await controller.getContractSourceCode(address);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
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
      });
    });

    it("returns empty source code response when contract verification info API fails with response status 404", async () => {
      pipeMock.mockImplementation((callback) => {
        return callback({
          stack: "error stack",
          response: {
            data: "response data",
            status: 404,
          },
        } as AxiosError);
      });

      const response = await controller.getContractSourceCode(address);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
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
      });
    });

    it("returns contract source code from verification info API for solc compiler and single file contract", async () => {
      const abi = [];

      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              artifacts: {
                abi,
              },
              request: {
                sourceCode: "sourceCode",
                constructorArguments: "0x0001",
                contractName: "contractName",
                optimizationUsed: false,
                compilerSolcVersion: "8.10.0",
                compilerZksolcVersion: "10.0.0",
              },
            },
          });
        })
      );

      const response = await controller.getContractSourceCode(address);
      expect(response).toEqual({
        message: "OK",
        result: [
          {
            ABI: "[]",
            CompilerVersion: "8.10.0",
            CompilerZksolcVersion: "10.0.0",
            ConstructorArguments: "0001",
            ContractName: "contractName",
            EVMVersion: "Default",
            Implementation: "",
            Library: "",
            LicenseType: "",
            OptimizationUsed: "0",
            Proxy: "0",
            Runs: "",
            SourceCode: "sourceCode",
            SwarmSource: "",
          },
        ],
        status: "1",
      });
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/info/${address}`);
    });

    it("returns contract source code from verification info API for solc compiler and multi file contract", async () => {
      const abi = [];

      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              artifacts: {
                abi,
              },
              request: {
                sourceCode: {
                  language: "Solidity",
                  settings: {
                    optimizer: {
                      enabled: true,
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
                constructorArguments: "0001",
                contractName: "contractName",
                optimizationUsed: true,
                compilerSolcVersion: "8.10.0",
                compilerZksolcVersion: "10.0.0",
              },
            },
          });
        })
      );

      const response = await controller.getContractSourceCode(address);
      expect(response).toEqual({
        message: "OK",
        result: [
          {
            ABI: "[]",
            CompilerVersion: "8.10.0",
            CompilerZksolcVersion: "10.0.0",
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
              '{{"language":"Solidity","settings":{"optimizer":{"enabled":true}},"sources":{"@openzeppelin/contracts/access/Ownable.sol":{"content":"Ownable.sol content"},"faucet.sol":{"content":"faucet.sol content"}}}}',
            SwarmSource: "",
          },
        ],
        status: "1",
      });
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/info/${address}`);
    });

    it("returns contract source code from verification info API for vyper compiler and single file contract", async () => {
      const abi = [];

      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              artifacts: {
                abi,
              },
              request: {
                sourceCode: "sourceCode",
                constructorArguments: "0x0001",
                contractName: "contractName",
                optimizationUsed: false,
                compilerVyperVersion: "9.10.0",
                compilerZkvyperVersion: "11.0.0",
              },
            },
          });
        })
      );

      const response = await controller.getContractSourceCode(address);
      expect(response).toEqual({
        message: "OK",
        result: [
          {
            ABI: "[]",
            CompilerVersion: "9.10.0",
            CompilerZkvyperVersion: "11.0.0",
            ConstructorArguments: "0001",
            ContractName: "contractName",
            EVMVersion: "Default",
            Implementation: "",
            Library: "",
            LicenseType: "",
            OptimizationUsed: "0",
            Proxy: "0",
            Runs: "",
            SourceCode: "sourceCode",
            SwarmSource: "",
          },
        ],
        status: "1",
      });
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/info/${address}`);
    });

    it("returns contract source code from verification info API for vyper compiler and multi file contract", async () => {
      const abi = [];

      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              artifacts: {
                abi,
              },
              request: {
                sourceCode: {
                  language: "Vyper",
                  settings: {
                    optimizer: {
                      enabled: true,
                    },
                  },
                  sources: {
                    "Base.vy": {
                      content: "Base.vy content",
                    },
                    "faucet.vy": {
                      content: "faucet.vy content",
                    },
                  },
                },
                constructorArguments: "0001",
                contractName: "contractName",
                optimizationUsed: true,
                compilerVyperVersion: "9.10.0",
                compilerZkvyperVersion: "11.0.0",
              },
            },
          });
        })
      );

      const response = await controller.getContractSourceCode(address);
      expect(response).toEqual({
        message: "OK",
        result: [
          {
            ABI: "[]",
            CompilerVersion: "9.10.0",
            CompilerZkvyperVersion: "11.0.0",
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
      });
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/info/${address}`);
    });
  });

  describe("getContractCreation", () => {
    it("thrown an error when called with more than 5 addresses", async () => {
      await expect(
        controller.getContractCreation([
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD",
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC",
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFB",
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA",
        ])
      ).rejects.toThrowError(new BadRequestException("Maximum 5 contract addresses per request"));
    });

    it("returns not OK response when no contracts found by given addresses", async () => {
      const response = await controller.getContractCreation([
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD",
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC",
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFB",
      ]);
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NO_DATA_FOUND,
        result: null,
      });
    });

    it("returns OK response when some of the contracts found by given addresses", async () => {
      jest.spyOn(addressServiceMock, "findByAddresses").mockResolvedValue([
        {
          address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          creatorAddress: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
          creatorTxHash: "0x37eeda3dd1b10afadfaba8e1896d9c513f527062cf04bb83f653c070c4725b7f",
        } as Address,
      ]);

      const response = await controller.getContractCreation(["0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"]);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: [
          {
            contractAddress: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
            contractCreator: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
            txHash: "0x37eeda3dd1b10afadfaba8e1896d9c513f527062cf04bb83f653c070c4725b7f",
          },
        ],
      });
    });
  });

  describe("parseAddressListPipeExceptionFactory", () => {
    it("returns new BadRequestException", () => {
      expect(parseAddressListPipeExceptionFactory()).toEqual(new BadRequestException("Missing contract addresses"));
    });
  });
});
