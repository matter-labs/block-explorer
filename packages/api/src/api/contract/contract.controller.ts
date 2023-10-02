import {
  Controller,
  Get,
  Query,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  UseFilters,
  ParseArrayPipe,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { catchError, firstValueFrom, of } from "rxjs";
import { AddressService } from "../../address/address.service";
import { ParseAddressPipe } from "../../common/pipes/parseAddress.pipe";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { ContractAbiResponseDto } from "../dtos/contract/contractAbiResponse.dto";
import { ContractSourceCodeResponseDto } from "../dtos/contract/contractSourceCodeResponse.dto";
import { ContractCreationResponseDto } from "../dtos/contract/contractCreationResponse.dto";
import { ApiExceptionFilter } from "../exceptionFilter";

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
    const { data } = await firstValueFrom(
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
    const { data } = await firstValueFrom(
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
      };
    }
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: [
        {
          ...{
            ABI: JSON.stringify(data.artifacts.abi),
            SourceCode:
              typeof data.request.sourceCode === "string"
                ? data.request.sourceCode
                : `{${JSON.stringify(data.request.sourceCode)}}`,
            // remove leading 0x as Etherscan does
            ConstructorArguments: data.request.constructorArguments?.startsWith("0x")
              ? data.request.constructorArguments.substring(2)
              : data.request.constructorArguments,
            ContractName: data.request.contractName,
            EVMVersion: "Default",
            OptimizationUsed: data.request.optimizationUsed ? "1" : "0",
            Library: "",
            LicenseType: "",
            CompilerVersion: data.request.compilerSolcVersion || data.request.compilerVyperVersion,
            Runs: "",
            SwarmSource: "",
            Proxy: "0",
            Implementation: "",
          },
          ...(data.request.compilerZksolcVersion && {
            CompilerZksolcVersion: data.request.compilerZksolcVersion,
          }),
          ...(data.request.compilerZkvyperVersion && {
            CompilerZkvyperVersion: data.request.compilerZkvyperVersion,
          }),
        },
      ],
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
}
