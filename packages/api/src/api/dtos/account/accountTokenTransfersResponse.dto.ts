import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";
import { AccountTokenTransferDto, AccountNFTTransferDto, AccountERC1155TransferDto } from "./accountTokenTransfer.dto";

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
    description: "ERC721 transfers list",
    type: AccountNFTTransferDto,
    isArray: true,
  })
  public readonly result: AccountNFTTransferDto[] | string;
}

export class AccountERC1155TransfersResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "ERC1155 transfers list",
    type: AccountERC1155TransferDto,
    isArray: true,
  })
  public readonly result: AccountERC1155TransferDto[] | string;
}
