import { IsInt, IsOptional, Max, Min, IsEnum, IsString, IsNotEmpty, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ContractVerificationCodeFormatEnum } from "../../types";

const fullLibraryNameRegexp = new RegExp("^(.)+:(.)+$");

export class VerifyContractRequestDto {
  @ApiProperty({
    description: "Module is always 'contract' for this endpoint",
    example: "contract",
    required: true,
  })
  private module: string;

  @ApiProperty({
    description: "Action is always 'verifysourcecode' for this endpoint",
    example: "verifysourcecode",
    required: true,
  })
  private action: string;

  @ApiProperty({
    name: "contractaddress",
    description: "Contract address to verify, starts with 0x",
    example: "0x0faF6df7054946141266420b43783387A78d82A9",
    required: true,
  })
  public contractaddress: string;

  @ApiProperty({
    name: "sourceCode",
    description:
      "Contract source code (Flattened if necessary) for single file or json input for standard json input format",
    example: {
      language: "Solidity",
      settings: {
        optimizer: {
          enabled: true,
        },
      },
      sources: {
        "contracts/HelloWorld.sol": {
          content: "// SPDX-License-Identifier: UNLICENSED ..",
        },
      },
    },
    required: true,
  })
  @IsNotEmpty({ message: "Missing sourceCode" })
  public sourceCode: string | any;

  @ApiProperty({
    name: "codeformat",
    description: `Contract code format. Supported values: ${Object.values(ContractVerificationCodeFormatEnum).join(
      ", "
    )}`,
    example: "solidity-standard-json-input",
    required: false,
  })
  @IsEnum(ContractVerificationCodeFormatEnum, {
    message: `Invalid codeformat. Supported values: ${Object.values(ContractVerificationCodeFormatEnum).join(", ")}`,
  })
  @IsOptional()
  public codeformat?: ContractVerificationCodeFormatEnum = ContractVerificationCodeFormatEnum.solidityJsonInput;

  @ApiProperty({
    name: "contractname",
    description: "Fully qualified contract name (e.g. contracts/HelloWorld.sol:HelloWorld)",
    example: "contracts/HelloWorld.sol:HelloWorld",
    required: true,
  })
  @IsString()
  @IsNotEmpty({
    message:
      "Missing Or invalid contractname. Fully qualified contract name is expected (e.g. contracts/HelloWorld.sol:HelloWorld)",
  })
  public contractname: string;

  @ApiProperty({
    name: "compilerversion",
    description: "Compiler version",
    example: "0.8.12",
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: "Missing Or invalid compilerversion." })
  public compilerversion: string;

  @ApiProperty({
    name: "zkCompilerVersion",
    description: "Zk compiler version",
    example: "v1.3.14",
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: "Missing zkCompilerVersion" })
  public zkCompilerVersion: string;

  @ApiProperty({
    name: "runs",
    description: "Number of expected contract calls",
    example: 200,
    required: false,
  })
  @Min(0)
  @Max(1000000)
  @IsInt({ message: "Runs value should be a number" })
  @Type(() => Number)
  @IsOptional()
  public runs?: number;

  @ApiProperty({
    name: "optimizationUsed",
    description: "0 = No Optimization, 1 = Optimization used",
    example: "1",
    required: true,
  })
  @IsEnum(["0", "1"], {
    message: "Invalid optimizationUsed",
  })
  @IsNotEmpty({ message: "Missing optimizationUsed" })
  public optimizationUsed: string;

  @ApiProperty({
    name: "constructorArguements",
    description: "Contract constructor arguments",
    example: "0x94869207468657265210000000000000000000000000000000000000000000000",
    required: false,
  })
  @IsOptional()
  @IsString()
  public constructorArguements?: string;

  @ApiProperty({
    name: "libraryname1",
    description:
      "library used in the contract, eg. contracts/SafeMath.sol:SafeMath. Supports up to 10 different libraries",
    example: "contracts/SafeMath.sol:SafeMath",
    required: false,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname1?: string;

  @ApiProperty({
    name: "libraryaddress1",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    example: "0x0faF6df7054946141266420b43783387A78d82A9",
    required: false,
  })
  @IsOptional()
  @IsString()
  public libraryaddress1?: string;

  @ApiProperty({
    name: "libraryname2",
    description: "library used in the contract, eg. contracts/SafeMath.sol:SafeMath",
    required: false,
    example: null,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname2?: string;

  @ApiProperty({
    name: "libraryaddress2",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    required: false,
    example: null,
  })
  @IsOptional()
  @IsString()
  public libraryaddress2?: string;

  @ApiProperty({
    name: "libraryname3",
    description: "library used in the contract, eg. contracts/SafeMath.sol:SafeMath",
    required: false,
    example: null,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname3?: string;

  @ApiProperty({
    name: "libraryaddress3",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    required: false,
    example: null,
  })
  @IsOptional()
  @IsString()
  public libraryaddress3?: string;

  @ApiProperty({
    name: "libraryname4",
    description: "library used in the contract, eg. contracts/SafeMath.sol:SafeMath",
    required: false,
    example: null,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname4?: string;

  @ApiProperty({
    name: "libraryaddress4",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    required: false,
    example: null,
  })
  @IsOptional()
  @IsString()
  public libraryaddress4?: string;

  @ApiProperty({
    name: "libraryname5",
    description: "library used in the contract, eg. contracts/SafeMath.sol:SafeMath",
    required: false,
    example: null,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname5?: string;

  @ApiProperty({
    name: "libraryaddress5",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    required: false,
    example: null,
  })
  @IsOptional()
  @IsString()
  public libraryaddress5?: string;

  @ApiProperty({
    name: "libraryname6",
    description: "library used in the contract, eg. contracts/SafeMath.sol:SafeMath",
    required: false,
    example: null,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname6?: string;

  @ApiProperty({
    name: "libraryaddress6",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  public libraryaddress6?: string;

  @ApiProperty({
    name: "libraryname7",
    description: "library used in the contract, eg. contracts/SafeMath.sol:SafeMath",
    example: null,
    required: false,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname7?: string;

  @ApiProperty({
    name: "libraryaddress7",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  public libraryaddress7?: string;

  @ApiProperty({
    name: "libraryname8",
    description: "library used in the contract, eg. contracts/SafeMath.sol:SafeMath",
    example: null,
    required: false,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname8?: string;

  @ApiProperty({
    name: "libraryaddress8",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  public libraryaddress8?: string;

  @ApiProperty({
    name: "libraryname9",
    description: "library used in the contract, eg. contracts/SafeMath.sol:SafeMath",
    example: null,
    required: false,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname9?: string;

  @ApiProperty({
    name: "libraryaddress9",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  public libraryaddress9?: string;

  @ApiProperty({
    name: "libraryname10",
    description: "library used in the contract, eg. contracts/SafeMath.sol:SafeMath",
    example: null,
    required: false,
  })
  @Matches(fullLibraryNameRegexp, {
    message: "Invalid library name. Fully qualified library name is expected, e.g. contracts/SafeMath.sol:SafeMath",
  })
  @IsOptional()
  @IsString()
  public libraryname10?: string;

  @ApiProperty({
    name: "libraryaddress10",
    description:
      "library address eg. 0x0faF6df7054946141266420b43783387A78d82A9 a matching pair of libraryname - libraryaddress must be provided",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  public libraryaddress10?: string;
}
