import { ApiProperty } from "@nestjs/swagger";
import { TransactionDto } from "./transaction.dto";

export class TransactionDetailsDto extends TransactionDto {
  @ApiProperty({
    type: String,
    description: "Gas used by the transaction",
    example: "50000000",
  })
  public readonly gasUsed: string;
}
