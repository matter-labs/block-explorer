import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class AccountEtherBalanceResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The account Ether balance",
    example: "5200000000000000000",
  })
  public readonly result: string;
}

export class AccountsEtherBalancesResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The accounts Ether balances",
    example: [
      {
        account: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
        balance: "5200000000000000000",
      },
      {
        account: "0x0E03197d697B592E5AE49EC14E952cddc9b28e14",
        balance: "4200000000000000000",
      },
    ],
  })
  public readonly result: { account: string; balance: string }[] | string;
}
