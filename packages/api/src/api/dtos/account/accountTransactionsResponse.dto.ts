import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";
import { AccountTransactionDto } from "./accountTransaction.dto";

export class AccountTransactionsResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The account transactions list",
    type: AccountTransactionDto,
    isArray: true,
  })
  public readonly result: AccountTransactionDto[];
}
