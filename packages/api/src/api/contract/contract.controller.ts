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
  AbiFragment,
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
  private readonly chainId: number;
  private readonly logger: Logger;

  constructor(
    private readonly addressService: AddressService,
    private readonly httpService: HttpService,
    configService: ConfigService
  ) {
    this.contractVerificationApiUrl = configService.get<string>("contractVerificationApiUrl");
    this.chainId = configService.get<number>("chainId");
    this.logger = new Logger(ContractController.name);
  }

  @Get("/getabi")
  public async getContractAbi(
    @Query("address", new ParseAddressPipe()) address: string
  ): Promise<ContractAbiResponseDto> {
    const { data } = await firstValueFrom<{ data: { abi: AbiFragment[] } }>(
      this.httpService.get(`${this.contractVerificationApiUrl}/v2/contract/${this.chainId}/${address}?fields=abi`).pipe(
        catchError((error: AxiosError) => {
          if (error.response?.status === 404) {
            throw new BadRequestException("Contract source code not verified");
          }
          this.logger.error({
            message: "Error fetching contract verification info",
            stack: error.stack,
            response: error.response?.data,
            contractAddress: address,
          });
          throw new InternalServerErrorException("Failed to get contract ABI");
        })
      )
    );
    if (!data?.abi) {
      throw new BadRequestException("Contract source code not verified");
    }
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: JSON.stringify(data.abi),
    };
  }

  @Get("/getsourcecode")
  public async getContractSourceCode(
    @Query("address", new ParseAddressPipe()) address: string
  ): Promise<ContractSourceCodeResponseDto> {
    const { data } = await firstValueFrom<{ data: ContractVerificationInfo }>(
      this.httpService
        .get(
          `${this.contractVerificationApiUrl}/v2/contract/${this.chainId}/${address}?fields=abi,sources,compilation,proxyResolution`
        )
        .pipe(
          catchError((error: AxiosError) => {
            if (error.response?.status !== 404) {
              this.logger.error({
                message: "Error fetching contract verification info",
                stack: error.stack,
                response: error.response?.data,
                contractAddress: address,
              });
            }
            if (error.response?.status >= 500) {
              throw new InternalServerErrorException("Failed to get contract source code");
            }
            return of({ data: null });
          })
        )
    );

    if (!data?.abi) {
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
    const contract = await this.addressService.findOne(contractAddress);

    const isSolidityContract = [
      ContractVerificationCodeFormatEnum.soliditySingleFile,
      ContractVerificationCodeFormatEnum.solidityJsonInput,
    ].includes(request.codeformat);

    const compilerVersion = request.compilerversion.replace(/^v/, "");
    const [contractPath] = request.contractname.split(":");
    if (request.codeformat.includes("json")) {
      request.sourceCode = JSON.parse(request.sourceCode);
    } else {
      request.sourceCode = {
        sources: {
          [contractPath]: {
            content: request.sourceCode,
          },
        },
      };
    }

    if (!request.sourceCode.settings) {
      request.sourceCode.settings = {};
    }

    if (request.evmVersion) {
      request.sourceCode.settings.evmVersion = request.evmVersion;
    }

    if (isSolidityContract) {
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

      request.sourceCode.settings.libraries = { ...request.sourceCode.settings.libraries, ...libraries };

      if (!request.sourceCode.settings.optimizer) {
        request.sourceCode.settings.optimizer = {
          enabled: request.optimizationUsed === "1",
        };
      }
      if (request.optimizationUsed) {
        request.sourceCode.settings.optimizer.enabled = request.optimizationUsed === "1";
      }
      if (request.runs) {
        request.sourceCode.settings.optimizer.runs = request.runs;
      }
    } else {
      if (request.optimizationUsed) {
        request.sourceCode.settings.optimize = request.optimizationUsed === "1";
      }
    }

    const { data } = await firstValueFrom<{ data: { verificationId: string } }>(
      this.httpService
        .post(`${this.contractVerificationApiUrl}/v2/verify/${this.chainId}/${contractAddress}`, {
          stdJsonInput: {
            language: isSolidityContract ? "Solidity" : "Vyper",
            sources: request.sourceCode.sources,
            settings: request.sourceCode.settings || {},
          },
          compilerVersion,
          contractIdentifier: request.contractname,
          // If creationTransactionHash is not provided sourcify performs expensive binary search
          // unless fetchContractCreationTxUsing is configured.
          // fetchContractCreationTxUsing config supports etherscan api but custom api url is not possible.
          // Contract might not be indexed yet if verification happens instantly after deployment.
          ...(contract?.creatorTxHash && { creationTransactionHash: contract.creatorTxHash }),
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error({
              message: "Error posting contract for verification",
              stack: error.stack,
              response: error.response?.data,
              code: error.code,
            });

            if (!error.response || error.response?.status >= 500) {
              throw new InternalServerErrorException("Failed to send verification request");
            }

            throw new BadRequestException(error.response?.data);
          })
        )
    );

    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: data.verificationId.toString(),
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
      this.httpService.get(`${this.contractVerificationApiUrl}/v2/verify/${verificationId}`).pipe(
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

    if (data.error) {
      return {
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: data.error.message || "Fail - Unable to verify",
      };
    }

    if (!data.isJobCompleted) {
      return {
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: ResponseResultMessage.VERIFICATION_QUEUED,
      };
    }

    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: ResponseResultMessage.VERIFICATION_SUCCESSFUL,
    };
  }
}
