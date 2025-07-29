import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifySignatureDto {
  @ApiProperty({ description: "JWT token" })
  @IsString()
  @IsNotEmpty()
  token: string;
}
