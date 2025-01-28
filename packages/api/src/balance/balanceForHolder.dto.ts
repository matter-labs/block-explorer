import { ApiProperty } from "@nestjs/swagger";

export class BalanceForHolderDto {
  @ApiProperty({ type: String, description: "Token balance", example: "0xd754F" })
  public readonly balance: string;

  @ApiProperty({
    type: String,
    description: "Holder address",
    example: "0x868e3b4391ff95C1cd99C6F9B5332b4EC2b8A63A",
  })
  public readonly address: string;
}
