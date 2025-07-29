import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Req,
  HttpException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOkResponse,
  ApiExcludeController,
  ApiNoContentResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";
import { swagger } from "../config/featureFlags";
import { Request } from "express";
import { VerifySignatureDto } from "./auth.dto";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";

const entityName = "auth";

@ApiTags("Auth BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class AuthController {
  private readonly logger: Logger;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger(AuthController.name);
  }

  @Post("login")
  @Header("Content-Type", "application/json")
  @ApiOkResponse({
    description: "Login was successful",
  })
  @ApiForbiddenResponse({
    description: "User is not allowed to access the app",
  })
  public async login(@Body() body: VerifySignatureDto, @Req() req: Request): Promise<boolean> {
    const url = new URL("/api/check/jwt-address", this.configService.get("prividium.permissionsApiUrl"));
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${body.token}` },
    });

    if (!response.ok) {
      throw new HttpException("User is not allowed to access the app", 403);
    }

    const data = await response.json();
    const validatedData = z.object({ address: z.string() }).safeParse(data);
    if (!validatedData.success) {
      throw new InternalServerErrorException("Invalid response from permissions API");
    }

    req.session.address = validatedData.data.address;
    req.session.token = body.token;
    return null;
  }

  @Post("logout")
  @Header("Content-Type", "application/json")
  @ApiNoContentResponse({
    description: "User was logged out successfully",
  })
  public async logout(@Req() req: Request) {
    this.clearSession(req);
  }

  @Get("me")
  @Header("Content-Type", "application/json")
  @ApiOkResponse({
    description: "User was returned successfully",
    schema: { type: "object", properties: { address: { type: "string" } } },
  })
  public async me(@Req() req: Request) {
    return { address: req.session.address };
  }

  private clearSession(req: Request) {
    req.session = null;
  }
}
