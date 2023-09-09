import { ApiProperty } from "@nestjs/swagger";
import { BaseAddressDto, AddressType } from "./baseAddress.dto";

export class ContractDto extends BaseAddressDto {
  @ApiProperty({
    description: `For account address type always equals to '${AddressType.Contract}'`,
    example: AddressType.Contract,
  })
  public readonly type: AddressType;

  @ApiProperty({
    type: String,
    description: "Contract bytecode",
    example: "0x0x000200000000000200080000000000020001000000010355",
  })
  public readonly bytecode: string;

  @ApiProperty({
    type: Number,
    description: "The number of the block that created the contract",
    example: 12345,
  })
  public readonly createdInBlockNumber: number;

  @ApiProperty({
    type: String,
    description: "The hash of the transaction that created the contract",
    example: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
  })
  public readonly creatorTxHash: string;

  @ApiProperty({
    type: Number,
    description: "The total number of transactions for the contract",
    example: 12345,
  })
  public readonly totalTransactions: number;

  @ApiProperty({
    type: String,
    description: "Creator address",
    example: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
  })
  public readonly creatorAddress: string;
}
