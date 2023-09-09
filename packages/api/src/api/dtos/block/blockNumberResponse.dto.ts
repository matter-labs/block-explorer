import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class BlockNumberResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The block number that was mined at a certain timestamp",
    example: "5784003",
  })
  public readonly result: string;
}
