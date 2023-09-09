import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";
import { AccountInternalTransactionDto } from "./accountInternalTransaction.dto";

export class AccountInternalTransactionsResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "Internal transactions list",
    type: AccountInternalTransactionDto,
    isArray: true,
  })
  public readonly result: AccountInternalTransactionDto[];
}
