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
import { SOURCE_CODE_EMPTY_INFO, mapContractSourceCode } from "../mappers/sourceCodeMapper";

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
