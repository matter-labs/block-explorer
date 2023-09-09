import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto, ResponseStatus } from "../common/responseBase.dto";

export class TransactionStatusDto {
  @ApiProperty({
    description: "Returns 0 for successful transactions and 1 for failed transactions",
    example: ResponseStatus.NOTOK,
  })
  public readonly isError: ResponseStatus;

  @ApiProperty({
    description: "Error description",
    example: "Reverted",
  })
  public readonly errDescription: string;
}

export class TransactionStatusResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "Status code of a contract execution",
    example: {
      isError: ResponseStatus.NOTOK,
      errDescription: "Reverted",
    },
  })
  public readonly result: TransactionStatusDto | string;
}
