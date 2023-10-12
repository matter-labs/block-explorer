import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";
import { AccountMinedBlock } from "./accountMinedBlock.dto";

export class AccountMinedBlocksResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "List of blocks validated by address",
    type: AccountMinedBlock,
    isArray: true,
  })
  public readonly result: AccountMinedBlock[];
}
