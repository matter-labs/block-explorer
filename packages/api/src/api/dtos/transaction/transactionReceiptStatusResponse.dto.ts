import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class TransactionReceiptStatusResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "Status code of a transaction execution",
    example: {
      status: "0",
    },
  })
  public readonly result: { status: string } | string;
}
