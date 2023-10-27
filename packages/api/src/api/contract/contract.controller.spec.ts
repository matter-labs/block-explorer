import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AxiosResponse, AxiosError } from "axios";
import * as rxjs from "rxjs";
import { AddressService } from "../../address/address.service";
import { Address } from "../../address/address.entity";
import { ResponseStatus, ResponseMessage, ResponseResultMessage } from "../dtos/common/responseBase.dto";
import { ContractController, parseAddressListPipeExceptionFactory } from "./contract.controller";
import { VerifyContractRequestDto } from "../dtos/contract/verifyContractRequest.dto";
import { SOURCE_CODE_EMPTY_INFO, mapContractSourceCode } from "../mappers/sourceCodeMapper";
import { ContractVerificationCodeFormatEnum } from "../types";

jest.mock("../mappers/sourceCodeMapper", () => ({
  ...jest.requireActual("../mappers/sourceCodeMapper"),
  mapContractSourceCode: jest.fn().mockReturnValue({ mockMappedSourceCode: true }),
}));

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
        result: [SOURCE_CODE_EMPTY_INFO],
      });
    });

    it("returns empty source code response when contract verification info is not found", async () => {
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
        result: [SOURCE_CODE_EMPTY_INFO],
      });
    });

    it("returns mapped source code for verified contract", async () => {
      const data = {
        artifacts: {
          abi: [],
        },
        request: {
          sourceCode: "sourceCode",
          constructorArguments: "0x0001",
          contractName: "contractName",
          optimizationUsed: false,
          compilerSolcVersion: "8.10.0",
          compilerZksolcVersion: "10.0.0",
        },
      };

      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data,
          });
        })
      );

      const response = await controller.getContractSourceCode(address);
      expect(mapContractSourceCode as jest.Mock).toHaveBeenCalledWith(data);
      expect(mapContractSourceCode as jest.Mock).toHaveBeenCalledTimes(1);
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/info/${address}`);
      expect(response).toEqual({
        message: "OK",
        result: [{ mockMappedSourceCode: true }],
        status: "1",
      });
    });
  });

  describe("verifySourceContract", () => {
    let pipeMock = jest.fn();
    let request: VerifyContractRequestDto;

    beforeEach(() => {
      pipeMock = jest.fn();
      jest.spyOn(httpServiceMock, "post").mockReturnValue({
        pipe: pipeMock,
      } as unknown as rxjs.Observable<AxiosResponse>);
      jest.spyOn(rxjs, "catchError").mockImplementation((callback) => callback as any);

      request = {
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
            "contracts/HelloWorld.sol": {
              content: "// SPDX-License-Identifier: UNLICENSED",
            },
          },
        },
        codeformat: ContractVerificationCodeFormatEnum.solidityJsonInput,
        contractname: "contracts/HelloWorld.sol:HelloWorld",
        compilerversion: "0.8.17",
        optimizationUsed: "1",
        zkCompilerVersion: "v1.3.14",
        constructorArguements: "0x94869207468657265210000000000000000000000000000000000000000000000",
        runs: 700,
        libraryname1: "contracts/MiniMath.sol:MiniMath",
        libraryaddress1: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
        libraryname2: "contracts/MiniMath2.sol:MiniMath2",
        libraryaddress2: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
      } as unknown as VerifyContractRequestDto;
    });

    it("sends proper payload to the verification endpoint for single file solidity contract", async () => {
      request = {
        ...request,
        sourceCode: "// SPDX-License-Identifier: UNLICENSED",
        codeformat: ContractVerificationCodeFormatEnum.soliditySingleFile,
      } as unknown as VerifyContractRequestDto;

      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: 1234,
          });
        })
      );

      await controller.verifySourceContract(request.contractaddress, request);
      expect(httpServiceMock.post).toBeCalledWith(`http://verification.api/contract_verification`, {
        codeFormat: "solidity-single-file",
        compilerSolcVersion: "0.8.17",
        compilerZksolcVersion: "v1.3.14",
        constructorArguments: "0x94869207468657265210000000000000000000000000000000000000000000000",
        contractAddress: "0x14174c76E073f8efEf5C1FE0dd0f8c2Ca9F21e62",
        contractName: "contracts/HelloWorld.sol:HelloWorld",
        optimizationUsed: true,
        sourceCode: "// SPDX-License-Identifier: UNLICENSED",
      });
    });

    it("sends proper payload to the verification endpoint for multi file solidity contract", async () => {
      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: 1234,
          });
        })
      );

      await controller.verifySourceContract(request.contractaddress, request);
      expect(httpServiceMock.post).toBeCalledWith(`http://verification.api/contract_verification`, {
        codeFormat: "solidity-standard-json-input",
        compilerSolcVersion: "0.8.17",
        compilerZksolcVersion: "v1.3.14",
        constructorArguments: "0x94869207468657265210000000000000000000000000000000000000000000000",
        contractAddress: "0x14174c76E073f8efEf5C1FE0dd0f8c2Ca9F21e62",
        contractName: "contracts/HelloWorld.sol:HelloWorld",
        optimizationUsed: true,
        sourceCode: {
          language: "Solidity",
          settings: {
            libraries: {
              "contracts/MiniMath.sol": {
                MiniMath: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
              },
              "contracts/MiniMath2.sol": {
                MiniMath2: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
              },
            },
            optimizer: {
              enabled: true,
              runs: 700,
            },
          },
          sources: {
            "contracts/HelloWorld.sol": {
              content: "// SPDX-License-Identifier: UNLICENSED",
            },
          },
        },
      });
    });

    it("adds optimizer specific fields to the payload if they are not set for multi file solidity contract", async () => {
      request.sourceCode = {
        language: "Solidity",
        sources: {
          "contracts/HelloWorld.sol": {
            content: "// SPDX-License-Identifier: UNLICENSED",
          },
        },
      };
      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: 1234,
          });
        })
      );

      await controller.verifySourceContract(request.contractaddress, request);
      expect(httpServiceMock.post).toBeCalledWith(`http://verification.api/contract_verification`, {
        codeFormat: "solidity-standard-json-input",
        compilerSolcVersion: "0.8.17",
        compilerZksolcVersion: "v1.3.14",
        constructorArguments: "0x94869207468657265210000000000000000000000000000000000000000000000",
        contractAddress: "0x14174c76E073f8efEf5C1FE0dd0f8c2Ca9F21e62",
        contractName: "contracts/HelloWorld.sol:HelloWorld",
        optimizationUsed: true,
        sourceCode: {
          language: "Solidity",
          settings: {
            libraries: {
              "contracts/MiniMath.sol": {
                MiniMath: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
              },
              "contracts/MiniMath2.sol": {
                MiniMath2: "0x1c1cEFA394748048BE6b04Ea6081fE44B26a5913",
              },
            },
            optimizer: {
              enabled: true,
              runs: 700,
            },
          },
          sources: {
            "contracts/HelloWorld.sol": {
              content: "// SPDX-License-Identifier: UNLICENSED",
            },
          },
        },
      });
    });

    it("sends proper payload to the verification endpoint for multi file vyper contract", async () => {
      const vyperVerificationRequest = {
        module: "contract",
        action: "verifysourcecode",
        contractaddress: "0x589160F112A9BFB16f0FD8C6434a27bC3703507D",
        sourceCode: {
          sources: {
            "contracts/Greeter.vy": {
              content: "# @version ^0.3.3 # vim: ft=python",
            },
          },
        },
        codeformat: "vyper-multi-file",
        contractname: "contracts/Greeter.vy:Greeter",
        compilerversion: "0.3.3",
        optimizationUsed: "1",
        zkCompilerVersion: "v1.3.11",
      } as unknown as VerifyContractRequestDto;

      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: 1234,
          });
        })
      );

      await controller.verifySourceContract(request.contractaddress, vyperVerificationRequest);
      expect(httpServiceMock.post).toBeCalledWith(`http://verification.api/contract_verification`, {
        codeFormat: "vyper-multi-file",
        compilerVyperVersion: "0.3.3",
        compilerZkvyperVersion: "v1.3.11",
        constructorArguments: undefined,
        contractAddress: "0x14174c76E073f8efEf5C1FE0dd0f8c2Ca9F21e62",
        contractName: "contracts/Greeter.vy:Greeter",
        optimizationUsed: true,
        sourceCode: {
          sources: {
            "contracts/Greeter.vy": {
              content: "# @version ^0.3.3 # vim: ft=python",
            },
          },
        },
      });
    });

    it("throws error when verification endpoint fails with response status different to 400", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
          response: {
            data: "response data",
            status: 500,
          },
        } as AxiosError);
      });

      await expect(controller.verifySourceContract(request.contractaddress, request)).rejects.toThrowError(
        new InternalServerErrorException("Failed to send verification request")
      );
    });

    it("throws error when verification endpoint fails with response status 400", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
          response: {
            data: "Contract has already been verified",
            status: 400,
          },
        } as AxiosError);
      });

      await expect(controller.verifySourceContract(request.contractaddress, request)).rejects.toThrowError(
        new BadRequestException("Contract has already been verified")
      );
    });

    it("throws error when contract verification info API fails without response data", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
        } as AxiosError);
      });

      await expect(controller.verifySourceContract(request.contractaddress, request)).rejects.toThrowError(
        new InternalServerErrorException("Failed to send verification request")
      );
    });

    it("returns verification id for verification request", async () => {
      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: 1234,
          });
        })
      );

      const response = await controller.verifySourceContract(request.contractaddress, request);
      expect(response).toEqual({
        message: "OK",
        result: "1234",
        status: "1",
      });
    });
  });

  describe("getVerificationStatus", () => {
    let pipeMock = jest.fn();
    const verificationId = "1234";

    beforeEach(() => {
      pipeMock = jest.fn();
      jest.spyOn(httpServiceMock, "get").mockReturnValue({
        pipe: pipeMock,
      } as unknown as rxjs.Observable<AxiosResponse>);
      jest.spyOn(rxjs, "catchError").mockImplementation((callback) => callback as any);
    });

    it("throws error when contract verification API fails with response status different to 404", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
          response: {
            data: "response data",
            status: 500,
          },
        } as AxiosError);
      });

      await expect(controller.getVerificationStatus(verificationId)).rejects.toThrowError(
        new InternalServerErrorException("Failed to get verification status")
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

      await expect(controller.getVerificationStatus(address)).rejects.toThrowError(
        new InternalServerErrorException("Contract verification submission not found")
      );
    });

    it("throws error when contract verification info API fails without response data", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
        } as AxiosError);
      });

      await expect(controller.getVerificationStatus(address)).rejects.toThrowError(
        new InternalServerErrorException("Failed to get verification status")
      );
    });

    it("throws error when contract verification is not specified", async () => {
      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {},
          });
        })
      );

      await expect(controller.getVerificationStatus(undefined)).rejects.toThrowError(
        new BadRequestException("Verification ID is not specified")
      );
    });

    it("returns successful verification status", async () => {
      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              status: "successful",
            },
          });
        })
      );

      const response = await controller.getVerificationStatus(verificationId);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: ResponseResultMessage.VERIFICATION_SUCCESSFUL,
      });
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/${verificationId}`);
    });

    it("returns queued verification status", async () => {
      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              status: "queued",
            },
          });
        })
      );

      const response = await controller.getVerificationStatus(verificationId);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: ResponseResultMessage.VERIFICATION_QUEUED,
      });
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/${verificationId}`);
    });

    it("returns in progress verification status", async () => {
      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              status: "in_progress",
            },
          });
        })
      );

      const response = await controller.getVerificationStatus(verificationId);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: ResponseResultMessage.VERIFICATION_IN_PROGRESS,
      });
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/${verificationId}`);
    });

    it("returns in progress verification status", async () => {
      pipeMock.mockReturnValue(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              status: "failed",
              error: "ERROR! Compilation error.",
            },
          });
        })
      );

      const response = await controller.getVerificationStatus(verificationId);
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: "ERROR! Compilation error.",
      });
      expect(httpServiceMock.get).toBeCalledWith(`http://verification.api/contract_verification/${verificationId}`);
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
