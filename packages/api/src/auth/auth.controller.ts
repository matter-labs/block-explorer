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
  public async login(@Body() body: VerifySignatureDto, @Req() req: Request): Promise<{ address: string }> {
    try {
      const response = await fetch(
        new URL("/api/user-wallets", this.configService.get("prividium.permissionsApiUrl")),
        {
          headers: { Authorization: `Bearer ${body.token}` },
        }
      );
      if (response.status === 403) {
        throw new HttpException("Invalid or expired token", 400);
      }

      const data = await response.json();
      const validatedData = z.object({ wallets: z.array(z.string()) }).safeParse(data);
      if (!validatedData.success) {
        this.logger.error("Invalid response from permissions API", response);
        throw new InternalServerErrorException();
      }

      if (validatedData.data.wallets.length === 0) {
        throw new HttpException("No wallets associated with the user", 400);
      }

      // Use first address from the user to filter
      const address = validatedData.data.wallets[0];
      req.session.address = address;
      req.session.token = body.token;
      return { address };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error("Login error:", error);
      throw new InternalServerErrorException("Authentication failed");
    }
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
