import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { TransferType } from "../../transfer/transfer.entity";

export class FilterAddressTransfersOptionsDto {
  @ApiPropertyOptional({
    description: "Transfer type to filter transfers by",
    example: TransferType.Transfer,
    enum: TransferType,
  })
  @IsOptional()
  public readonly type?: TransferType;
}
