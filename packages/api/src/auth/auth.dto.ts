import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifySignatureDto {
  @ApiProperty({
    description: "SIWE message",
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: "SIWE message signature" })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
