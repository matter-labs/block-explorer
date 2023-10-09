import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class LogApiDto {
  @ApiProperty({
    type: String,
    description: "The address of the contract that generated this log",
    example: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
  })
  public readonly address: string;

  @ApiProperty({
    type: String,
    isArray: true,
    description: "The list of topics (indexed properties) for this log",
    example: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x000000000000000000000000b7e2355b87ff9ae9b146ca6dcee9c02157937b01",
    ],
  })
  public readonly topics: string[];

  @ApiProperty({
    type: String,
    description: "The data included in this log",
    example: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
  })
  public readonly data: string;

  @ApiProperty({
    type: String,
    description: "The block height of the block including the transaction of this log",
    example: "0xc48174",
  })
  public readonly blockNumber: string;

  @ApiProperty({
    type: String,
    description: "The timestamp when the log was created",
    example: "0x65230fce",
  })
  public readonly timeStamp: string;

  @ApiProperty({
    type: String,
    description: "Gas price for the transaction of this log",
    example: "0x60f9ce56",
  })
  public readonly gasPrice: string;

  @ApiProperty({
    type: String,
    description: "Gas used by the transaction of this log",
    example: "0x60f9ce56",
  })
  public readonly gasUsed: string;

  @ApiProperty({
    type: String,
    description: "The index of this log across all logs in the entire block",
    example: "0x1",
  })
  public readonly logIndex: string;

  @ApiProperty({
    type: String,
    description: "The transaction hash of the transaction of this log",
    example: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
    examples: ["0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0", null],
    nullable: true,
  })
  public readonly transactionHash?: string;

  @ApiProperty({
    type: String,
    description: "The index of the transaction in the block of the transaction of this log",
    example: "0x1",
  })
  public readonly transactionIndex: string;
}

export class LogsResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "Logs for an address",
    type: LogApiDto,
    isArray: true,
  })
  public readonly result: LogApiDto[];
}
