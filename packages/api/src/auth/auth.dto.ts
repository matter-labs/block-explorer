import { IsNotEmpty, IsString, IsEthereumAddress } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifySignatureDto {
  @ApiProperty({ description: "JWT token" })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class SwitchWalletDto {
  @ApiProperty({ description: "Wallet address to switch to" })
  @IsString()
  @IsNotEmpty()
  @IsEthereumAddress()
  address: string;
}
