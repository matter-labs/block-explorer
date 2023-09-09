import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";
import { AccountTokenTransferDto, AccountNFTTransferDto } from "./accountTokenTransfer.dto";

export class AccountTokenTransfersResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "Token transfers list",
    type: AccountTokenTransferDto,
    isArray: true,
  })
  public readonly result: AccountTokenTransferDto[] | string;
}

export class AccountNFTTransfersResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "NFT transfers list",
    type: AccountNFTTransferDto,
    isArray: true,
  })
  public readonly result: AccountNFTTransferDto[] | string;
}
