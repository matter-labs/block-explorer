import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class ContractVerificationStatusResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "Verification result explanation",
    example: "Pass - Verified",
    examples: ["Pass - Verified", "Fail - Unable to verify", "Pending in queue", "In progress"],
  })
  public readonly result: string;
}
