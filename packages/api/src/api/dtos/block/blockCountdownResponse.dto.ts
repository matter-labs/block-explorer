import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";
import { BlockCountdownDto } from "./blockCountdown.dto";

export class BlockCountdownResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The estimated time remaining, in seconds, until a certain block is mined",
    type: BlockCountdownDto,
  })
  public readonly result: BlockCountdownDto | string;
}
