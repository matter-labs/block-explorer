import { Controller, Get, Query, Logger, UseFilters } from "@nestjs/common";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { TransactionService } from "../../transaction/transaction.service";
import { TransactionReceiptService } from "../../transaction/transactionReceipt.service";
import { TransactionStatus } from "../../transaction/entities/transaction.entity";
import { ParseTransactionHashPipe } from "../../common/pipes/parseTransactionHash.pipe";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { ContractAbiResponseDto } from "../dtos/contract/contractAbiResponse.dto";
import { ApiExceptionFilter } from "../exceptionFilter";

const entityName = "transaction";

@ApiExcludeController()
@ApiTags(entityName)
@Controller(`api/${entityName}`)
@UseFilters(ApiExceptionFilter)
export class TransactionController {
  private readonly logger: Logger;

  constructor(
    private readonly transactionService: TransactionService,
    private readonly transactionReceiptService: TransactionReceiptService
  ) {
    this.logger = new Logger(TransactionController.name);
  }

  @Get("/getstatus")
  public async getTransactionStatus(
    @Query("txhash", new ParseTransactionHashPipe()) transactionHash: string
  ): Promise<ContractAbiResponseDto> {
    const transaction = await this.transactionService.findOne(transactionHash);
    const hasError = transaction?.status === TransactionStatus.Failed;
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: {
        isError: hasError ? ResponseStatus.OK : ResponseStatus.NOTOK,
        errDescription: "",
      },
    };
  }

  @Get("/gettxreceiptstatus")
  public async getTransactionReceiptStatus(
    @Query("txhash", new ParseTransactionHashPipe()) transactionHash: string
  ): Promise<ContractAbiResponseDto> {
    const transactionReceipt = await this.transactionReceiptService.findOne(transactionHash, ["status"]);
    const status = transactionReceipt?.status.toString() || "";
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: {
        status,
      },
    };
  }
}
