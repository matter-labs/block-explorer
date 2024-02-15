import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class ContractSourceCodeDto {
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
  public readonly ABI: string;

  @ApiProperty({
    description: "The contract source code",
    example: `{${JSON.stringify({
      language: "Solidity",
      settings: {
        optimizer: {
          enabled: true,
        },
      },
      sources: {
        "@openzeppelin/contracts/access/Ownable.sol": {
          content: "// SPDX-License-Identifier: MIT\n// OpenZeppelin Contracts (last updated v4.9.0) ...",
        },
        "@openzeppelin/contracts/utils/Context.sol": {
          content: "// SPDX-License-Identifier: MIT\n// OpenZeppelin Contracts v4.4.1 (utils/Context.sol) ...",
        },
        "contracts/interfaces/ILayerZeroEndpoint.sol": {
          content: "// SPDX-License-Identifier: MIT\n\npragma solidity >=0.5.0; ...",
        },
        "contracts/interfaces/ILayerZeroReceiver.sol": {
          content: "// SPDX-License-Identifier: MIT\n\npragma solidity >=0.5.0; ...",
        },
        "contracts/interfaces/ILayerZeroUserApplicationConfig.sol": {
          content: "// SPDX-License-Identifier: MIT\n\npragma solidity >=0.5.0; ...",
        },
        "contracts/msgs.sol": {
          content: "// SPDX-License-Identifier: MIT\r\npragma solidity >=0.8.12; ...",
        },
      },
    })}}`,
  })
  public readonly SourceCode: string;

  @ApiProperty({
    description: "Contract constructor arguments",
    example: "0000000000000000000000009b896c0e23220469c7ae69cb4bbae391eaa4c8da",
  })
  public readonly ConstructorArguments: string;

  @ApiProperty({
    description: "Contract name",
    example: "TestContractName",
  })
  public readonly ContractName: string;

  @ApiProperty({
    description: "Indicates if optimization was used for the contract. 1 - optimization was used, 0 - otherwise",
    example: "1",
  })
  public readonly OptimizationUsed: string;

  @ApiProperty({
    description: "Contract library",
    example: "",
  })
  public readonly Library: string;

  @ApiProperty({
    description: "Contract license type",
    example: "Unknown",
  })
  public readonly LicenseType: string;

  @ApiProperty({
    description: "Contract compiler version",
    example: "0.8.12",
  })
  public readonly CompilerVersion: string;

  @ApiProperty({
    description: "Zk compiler version",
    example: "v1.3.14",
  })
  public readonly ZkCompilerVersion?: string;

  @ApiProperty({
    description: "EVM version",
    example: "Default",
  })
  public readonly EVMVersion: string;

  @ApiProperty({
    description: "Number of runs",
    example: "200",
  })
  public readonly Runs: string;

  @ApiProperty({
    description: "Contract swarm source",
    example: "",
  })
  public readonly SwarmSource: string;

  @ApiProperty({
    description: "Indicates if the contract is a proxy contract. 1 - the contract is a proxy, 0 - otherwise",
    example: "0",
  })
  public readonly Proxy: string;

  @ApiProperty({
    description: "Contract implementation address for proxy contracts. Empty for non proxy contracts.",
    example: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
  })
  public readonly Implementation: string;
}

export class ContractSourceCodeResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "Contract source code",
    type: ContractSourceCodeDto,
    isArray: true,
  })
  public readonly result: ContractSourceCodeDto[];
}
