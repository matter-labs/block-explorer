import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class AccountTokenBalanceResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The account Token balance",
    example: "5200000000000000000",
  })
  public readonly result: string;
}
