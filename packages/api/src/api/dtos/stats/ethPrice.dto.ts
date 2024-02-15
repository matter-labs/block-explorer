import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class EthPriceDto {
  @ApiProperty({
    type: String,
    description: "ETH price in USD",
    example: "1823.567",
  })
  public readonly ethusd: string;

  @ApiProperty({
    type: String,
    description: "ETH price timestamp",
    example: "1624961308",
  })
  public readonly ethusd_timestamp: string;
}

export class EthPriceResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "ETH price",
    type: EthPriceDto,
  })
  public readonly result: EthPriceDto;
}
