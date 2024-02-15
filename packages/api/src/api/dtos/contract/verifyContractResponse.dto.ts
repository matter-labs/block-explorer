import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class VerifyContractResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "Verification ID that can be used for checking the verification status",
    example: "43980",
  })
  public readonly result: string;
}
