import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class ContractAbiResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The contract ABI",
    example: JSON.stringify([
      {
        inputs: [
          {
            name: "greeting",
            type: "string",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        inputs: [
          {
            name: "_greeting",
            type: "string",
          },
        ],
        name: "setup",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "greet",
        outputs: [
          {
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [
          {
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "greeting",
        outputs: [
          {
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ]),
  })
  public readonly result: string;
}
