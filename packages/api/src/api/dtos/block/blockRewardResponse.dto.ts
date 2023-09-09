import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";
import { BlockRewardDto } from "./blockReward.dto";

export class BlockRewardResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The block reward and 'Uncle' block rewards",
    type: BlockRewardDto,
  })
  public readonly result: BlockRewardDto;
}
