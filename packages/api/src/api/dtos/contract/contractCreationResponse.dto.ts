import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class ContractCreationInfoDto {
  @ApiProperty({
    description: "Contract address",
    example: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
  })
  public readonly contractAddress: string;

  @ApiProperty({
    description: "Contract creator address",
    example: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
  })
  public readonly contractCreator: string;

  @ApiProperty({
    description: "Transaction hash contract was created",
    example: "0x37eeda3dd1b10afadfaba8e1896d9c513f527062cf04bb83f653c070c4725b7f",
  })
  public readonly txHash: string;
}

export class ContractCreationResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The contract creation info",
    example: [
      {
        contractAddress: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
        contractCreator: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
        txHash: "0x37eeda3dd1b10afadfaba8e1896d9c513f527062cf04bb83f653c070c4725b7f",
      },
      {
        contractAddress: "0x0E03197d697B592E5AE49EC14E952cddc9b28e14",
        contractCreator: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
        txHash: "0xcaecae4ceb6ad494c9f7c7c6897e6a61f12984053521d8c4ba2bc8801037b4ff",
      },
    ],
  })
  public readonly result: ContractCreationInfoDto[] | string | null;
}
