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
import { catchError, firstValueFrom, of } from "rxjs";
import { AddressService } from "../../address/address.service";
import { ParseAddressPipe } from "../../common/pipes/parseAddress.pipe";
import { ResponseStatus, ResponseMessage, ResponseResultMessage } from "../dtos/common/responseBase.dto";
import { ContractAbiResponseDto } from "../dtos/contract/contractAbiResponse.dto";
import { ContractSourceCodeResponseDto } from "../dtos/contract/contractSourceCodeResponse.dto";
import { ContractCreationResponseDto } from "../dtos/contract/contractCreationResponse.dto";
import { VerifyContractRequestDto } from "../dtos/contract/verifyContractRequest.dto";
import { ContractVerificationStatusResponseDto } from "../dtos/contract/contractVerificationStatusResponse.dto";
import { ApiExceptionFilter } from "../exceptionFilter";
import { SOURCE_CODE_EMPTY_INFO, mapContractSourceCode } from "../mappers/sourceCodeMapper";
import {
  ContractVerificationInfo,
  ContractVerificationCodeFormatEnum,
  ContractVerificationStatusResponse,
} from "../types";
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
    const { data } = await firstValueFrom<{ data: ContractVerificationInfo }>(
      this.httpService.get(`${this.contractVerificationApiUrl}/contract_verification/info/${address}`).pipe(
        catchError((error: AxiosError) => {
          if (error.response?.status === 404) {
            throw new BadRequestException("Contract source code not verified");
          }
          this.logger.error({
            message: "Error fetching contract verification info",
            stack: error.stack,
            response: error.response?.data,
          });
          throw new InternalServerErrorException("Failed to get contract ABI");
        })
      )
    );
    if (!data.artifacts?.abi) {
      throw new BadRequestException("Contract source code not verified");
    }
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: JSON.stringify(data.artifacts.abi),
    };
  }

  @Get("/getsourcecode")
  public async getContractSourceCode(
    @Query("address", new ParseAddressPipe()) address: string
  ): Promise<ContractSourceCodeResponseDto> {
    const { data } = await firstValueFrom<{ data: ContractVerificationInfo }>(
      this.httpService.get(`${this.contractVerificationApiUrl}/contract_verification/info/${address}`).pipe(
        catchError((error: AxiosError) => {
          this.logger.error({
            message: "Error fetching contract verification info",
            stack: error.stack,
            response: error.response?.data,
          });
          if (error.response?.status >= 500) {
            throw new InternalServerErrorException("Failed to get contract source code");
          }
          return of({ data: null });
        })
      )
    );

    if (!data?.artifacts?.abi) {
      return {
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: [SOURCE_CODE_EMPTY_INFO],
      };
    }

    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: [mapContractSourceCode(data)],
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

    if (isSolidityContract && request.sourceCode instanceof Object) {
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
    }

    const { data } = await firstValueFrom<{ data: number }>(
      this.httpService
        .post(`${this.contractVerificationApiUrl}/contract_verification`, {
          codeFormat: request.codeformat,
          contractAddress,
          contractName: request.contractname,
          optimizationUsed: request.optimizationUsed === "1",
          sourceCode: request.sourceCode,
          constructorArguments: request.constructorArguements,
          ...(isSolidityContract && {
            compilerZksolcVersion: request.zkCompilerVersion,
            compilerSolcVersion: request.compilerversion,
          }),
          ...(!isSolidityContract && {
            compilerZkvyperVersion: request.zkCompilerVersion,
            compilerVyperVersion: request.compilerversion,
          }),
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

    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: data.toString(),
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
