import { ApiProperty } from "@nestjs/swagger";

export enum ResponseStatus {
  OK = "1",
  NOTOK = "0",
}

export enum ResponseMessage {
  OK = "OK",
  NOTOK = "NOTOK",
  NO_DATA_FOUND = "No data found",
  NO_RECORD_FOUND = "No record found",
  NO_TRANSACTIONS_FOUND = "No transactions found",
}

export enum ResponseResultMessage {
  INVALID_PARAM = "Error! Invalid parameter",
  VERIFICATION_SUCCESSFUL = "Pass - Verified",
  VERIFICATION_QUEUED = "Pending in queue",
  VERIFICATION_IN_PROGRESS = "In progress",
}

export class ResponseBaseDto {
  @ApiProperty({
    description: "Response status",
    example: ResponseStatus.OK,
  })
  public readonly status: ResponseStatus;

  @ApiProperty({
    type: String,
    description: "Response message",
    example: ResponseMessage.OK,
  })
  public readonly message: string;
}
