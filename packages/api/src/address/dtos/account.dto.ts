import { ApiProperty } from "@nestjs/swagger";
import { BaseAddressDto, AddressType } from "./baseAddress.dto";

export class AccountDto extends BaseAddressDto {
  @ApiProperty({
    description: `For account address type always equals to '${AddressType.Account}'`,
    example: AddressType.Account,
  })
  public readonly type: AddressType;

  @ApiProperty({
    type: Number,
    description: "The nonce for the account in sealed blocks",
    example: 12345,
  })
  public readonly sealedNonce: number;

  @ApiProperty({
    type: Number,
    description: "The nonce for the account in verified blocks",
    example: 12345,
  })
  public readonly verifiedNonce: number;
}
