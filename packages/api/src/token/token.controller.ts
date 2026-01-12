import { Controller, Get, Param, NotFoundException, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiExcludeController,
  ApiQuery,
} from "@nestjs/swagger";
import { Pagination } from "nestjs-typeorm-paginate";
import { PagingOptionsWithMaxItemsLimitDto } from "../common/dtos";
import { ApiListPageOkResponse } from "../common/decorators/apiListPageOkResponse";
import { TokenService } from "./token.service";
import { FilterTransfersOptions, TransferService } from "../transfer/transfer.service";
import { TokenDto } from "./token.dto";
import { TransferDto } from "../transfer/transfer.dto";
import { ParseLimitedIntPipe } from "../common/pipes/parseLimitedInt.pipe";
import { ParseAddressPipe, ADDRESS_REGEX_PATTERN } from "../common/pipes/parseAddress.pipe";
import { swagger } from "../config/featureFlags";
import { constants } from "../config/docs";
import { User } from "../user/user.decorator";
import { AddUserRolesPipe, UserWithRoles } from "../api/pipes/addUserRoles.pipe";

const entityName = "tokens";

@ApiTags("Token BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class TokenController {
  constructor(private readonly tokenService: TokenService, private readonly transferService: TransferService) {}

  @Get("")
  @ApiListPageOkResponse(TokenDto, { description: "Successfully returned token list" })
  @ApiBadRequestResponse({ description: "Paging query params are not valid or out of range" })
  @ApiQuery({
    name: "minLiquidity",
    type: "integer",
    description: "Min liquidity filter",
    example: 100000,
    required: false,
  })
  public async getTokens(
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Query("minLiquidity", new ParseLimitedIntPipe({ min: 0, isOptional: true })) minLiquidity?: number
  ): Promise<Pagination<TokenDto>> {
    return await this.tokenService.findAll(
      {
        minLiquidity,
      },
      {
        filterOptions: { minLiquidity },
        ...pagingOptions,
        route: entityName,
      }
    );
  }

  @Get(":address")
  @ApiParam({
    name: "address",
    type: String,
    schema: { pattern: ADDRESS_REGEX_PATTERN },
    example: constants.tokenAddress,
    description: "Valid hex address",
  })
  @ApiOkResponse({ description: "Token was returned successfully", type: TokenDto })
  @ApiBadRequestResponse({ description: "Token address is invalid" })
  @ApiNotFoundResponse({ description: "Token with the specified address does not exist" })
  public async getToken(@Param("address", new ParseAddressPipe()) address: string): Promise<TokenDto> {
    const token = await this.tokenService.findOne(address);
    if (!token) {
      throw new NotFoundException();
    }
    return token;
  }

  @Get(":address/transfers")
  @ApiParam({
    name: "address",
    type: String,
    schema: { pattern: ADDRESS_REGEX_PATTERN },
    example: constants.tokenAddress,
    description: "Valid hex address",
  })
  @ApiListPageOkResponse(TransferDto, { description: "Successfully returned token transfers list" })
  @ApiBadRequestResponse({
    description: "Token address is invalid or paging query params are not valid or out of range",
  })
  @ApiNotFoundResponse({ description: "Token with the specified address does not exist" })
  public async getTokenTransfers(
    @Param("address", new ParseAddressPipe()) address: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @User(AddUserRolesPipe) user: UserWithRoles
  ): Promise<Pagination<TransferDto>> {
    if (!(await this.tokenService.exists(address))) {
      throw new NotFoundException();
    }

    const userFilters: FilterTransfersOptions = user && !user.isAdmin ? { visibleBy: user.address } : {};
    return await this.transferService.findAll(
      {
        tokenAddress: address,
        isFeeOrRefund: false,
        ...userFilters,
      },
      {
        ...pagingOptions,
        route: `${entityName}/${address}/transfers`,
      }
    );
  }
}
