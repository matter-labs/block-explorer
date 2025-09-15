import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  UseFilters,
  ParseArrayPipe,
  HttpCode,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import { AddressService } from "../../address/address.service";
import { ParseAddressPipe } from "../../common/pipes/parseAddress.pipe";
import { ResponseStatus, ResponseMessage, ResponseResultMessage } from "../dtos/common/responseBase.dto";
import { ContractAbiResponseDto } from "../dtos/contract/contractAbiResponse.dto";
import { ContractSourceCodeResponseDto, VerifiedSource } from "../dtos/contract/contractSourceCodeResponse.dto";
import { ContractCreationResponseDto } from "../dtos/contract/contractCreationResponse.dto";
import { VerifyContractRequestDto } from "../dtos/contract/verifyContractRequest.dto";
import { ContractVerificationStatusResponseDto } from "../dtos/contract/contractVerificationStatusResponse.dto";
import { ApiExceptionFilter } from "../exceptionFilter";
import { SOURCE_CODE_EMPTY_INFO, mapContractSourceCodeV2 } from "../mappers/sourceCodeMapper";
import { ContractVerificationCodeFormatEnum, ContractVerificationStatusResponse } from "../types";
import { VerifyContractResponseDto } from "../dtos/contract/verifyContractResponse.dto";

const entityName = "contract";

export const parseAddressListPipeExceptionFactory = () => new BadRequestException("Missing contract addresses");

@ApiExcludeController()
@ApiTags(entityName)
@Controller(`api/${entityName}`)
@UseFilters(ApiExceptionFilter)
export class ContractController {
  private readonly contractVerificationApiUrl: string;
  private readonly logger: Logger;
  // todo: temporary in-memory storage, should be persisted in DB
  private readonly storage: { [key: string]: VerifiedSource } = {};

  constructor(
    private readonly addressService: AddressService,
    private readonly httpService: HttpService,
    configService: ConfigService
  ) {
    this.contractVerificationApiUrl = configService.get<string>("contractVerificationApiUrl");
    this.logger = new Logger(ContractController.name);
  }

  @Get("/getabi")
  public async getContractAbi(
    @Query("address", new ParseAddressPipe()) address: string
  ): Promise<ContractAbiResponseDto> {
    const contract = await this.storage[address];
    if (!contract) {
      throw new BadRequestException("Contract source code not verified");
    }
    if (!contract.abi) {
      throw new InternalServerErrorException("Verified contract ABI is missing");
    }
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: contract.abi,
    };
  }

  @Get("/getsourcecode")
  public async getContractSourceCode(
    @Query("address", new ParseAddressPipe()) address: string
  ): Promise<ContractSourceCodeResponseDto> {
    const contract = await this.storage[address];
    if (!contract || !contract.abi) {
      return {
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: [SOURCE_CODE_EMPTY_INFO],
      };
    }

    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: [mapContractSourceCodeV2(contract)],
    };
  }

  @HttpCode(200)
  @Post("/verifysourcecode")
  public async verifySourceContract(
    @Body(
      "contractaddress",
      new ParseAddressPipe({
        required: true,
        errorMessage: "Missing or invalid contractAddress (should start with 0x)",
      })
    )
    contractAddress,
    @Body() request: VerifyContractRequestDto
  ): Promise<VerifyContractResponseDto> {
    const isSolidityContract = [
      ContractVerificationCodeFormatEnum.soliditySingleFile,
      ContractVerificationCodeFormatEnum.solidityJsonInput,
    ].includes(request.codeformat);

    if (!isSolidityContract) {
      throw new BadRequestException("Only solidity contracts are supported");
    }

    const contract = await this.addressService.findOne(contractAddress);

    if (request.sourceCode instanceof Object) {
      const libraries: { [key: string]: Record<string, string> } = {};
      for (let i = 1; i <= 10; i++) {
        const libName: string = request[`libraryname${i}`];
        const libAddress: string = request[`libraryaddress${i}`];
        if (libName && libAddress) {
          const [filePath, contractName] = libName.split(":");
          libraries[filePath] = {
            ...libraries[filePath],
            [contractName]: libAddress,
          };
        }
      }

      if (!request.sourceCode.settings) {
        request.sourceCode.settings = {};
      }

      request.sourceCode.settings.libraries = { ...request.sourceCode.settings.libraries, ...libraries };

      if (request.runs) {
        if (!request.sourceCode.settings.optimizer) {
          request.sourceCode.settings.optimizer = {
            enabled: true,
          };
        }
        request.sourceCode.settings.optimizer.runs = request.runs;
      }
    } else {
      request.sourceCode = {
        language: "Solidity",
        sources: request.sourceCode,
        settings: {},
      };
    }

    const input = JSON.stringify(request.sourceCode);

    const { data } = await firstValueFrom<{ data: any }>(
      this.httpService
        .post(`${this.contractVerificationApiUrl}/api/v2/verifier/solidity/sources:verify-standard-json`, {
          bytecodeType: "DEPLOYED_BYTECODE",
          bytecode: contract.bytecode,
          compilerVersion: request.compilerversion,
          input,
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error({
              message: "Error posting contract for verification",
              stack: error.stack,
              response: error.response?.data,
            });

            if (error.response?.status === 400) {
              throw new BadRequestException(error.response.data);
            }

            throw new InternalServerErrorException("Failed to send verification request");
          })
        )
    );

    if (data.message === "OK" && data.status === "SUCCESS") {
      this.storage[contractAddress] = data.source;
    }

    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: data.source,
    };
  }

  @Get("/getcontractcreation")
  public async getContractCreation(
    @Query(
      "contractaddresses",
      new ParseArrayPipe({
        items: String,
        separator: ",",
        exceptionFactory: parseAddressListPipeExceptionFactory,
      }),
      new ParseAddressPipe({ required: true, each: true, errorMessage: "Invalid contract addresses" })
    )
    addresses: string[]
  ): Promise<ContractCreationResponseDto> {
    const uniqueAddresses = [...new Set(addresses)];
    if (uniqueAddresses.length > 5) {
      throw new BadRequestException("Maximum 5 contract addresses per request");
    }
    const contracts = await this.addressService.findByAddresses(uniqueAddresses);
    const result = contracts.map((contract) => ({
      contractAddress: contract.address,
      contractCreator: contract.creatorAddress,
      txHash: contract.creatorTxHash,
    }));

    return {
      status: result.length ? ResponseStatus.OK : ResponseStatus.NOTOK,
      message: result.length ? ResponseMessage.OK : ResponseMessage.NO_DATA_FOUND,
      result: result.length ? result : null,
    };
  }

  @HttpCode(200)
  @Post("/checkverifystatus")
  public async checkVerificationStatus(
    @Body("guid") verificationId: string
  ): Promise<ContractVerificationStatusResponseDto> {
    return this.getVerificationStatus(verificationId);
  }

  @Get("/checkverifystatus")
  public async getVerificationStatus(
    @Query("guid") verificationId: string
  ): Promise<ContractVerificationStatusResponseDto> {
    if (!verificationId) {
      throw new BadRequestException("Verification ID is not specified");
    }

    const { data } = await firstValueFrom<{ data: ContractVerificationStatusResponse }>(
      this.httpService.get(`${this.contractVerificationApiUrl}/contract_verification/${verificationId}`).pipe(
        catchError((error: AxiosError) => {
          if (error.response?.status === 404) {
            throw new BadRequestException("Contract verification submission not found");
          }
          this.logger.error({
            message: "Error fetching contract verification status",
            stack: error.stack,
            response: error.response?.data,
          });
          throw new InternalServerErrorException("Failed to get verification status");
        })
      )
    );

    if (data.status === "successful") {
      return {
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: ResponseResultMessage.VERIFICATION_SUCCESSFUL,
      };
    }

    if (data.status === "queued") {
      return {
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: ResponseResultMessage.VERIFICATION_QUEUED,
      };
    }

    if (data.status === "in_progress") {
      return {
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: ResponseResultMessage.VERIFICATION_IN_PROGRESS,
      };
    }

    return {
      status: ResponseStatus.NOTOK,
      message: ResponseMessage.NOTOK,
      result: data.error,
    };
  }
}
