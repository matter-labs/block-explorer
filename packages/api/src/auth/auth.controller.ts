import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Req,
  HttpException,
  UnprocessableEntityException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOkResponse,
  ApiExcludeController,
  ApiUnprocessableEntityResponse,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
} from "@nestjs/swagger";
import { swagger } from "../config/featureFlags";
import { generateNonce, SiweErrorType, SiweMessage } from "siwe";
import { Request } from "express";
import { VerifySignatureDto } from "./auth.dto";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";

const entityName = "auth";

@ApiTags("Auth BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Get("nonce")
  @Header("Content-Type", "text/plain")
  @ApiOkResponse({
    description: "Message was returned successfully",
    schema: { type: "string" },
  })
  public getNonce(@Req() req: Request): string {
    req.session.nonce = generateNonce();
    return req.session.nonce;
  }

  @Post("verify")
  @Header("Content-Type", "application/json")
  @ApiOkResponse({
    description: "Signature was verified successfully",
    schema: { type: "boolean" },
  })
  @ApiBadRequestResponse({
    description: "Nonce must be requested first",
    schema: { type: "object", properties: { message: { type: "string" } } },
  })
  @ApiBadRequestResponse({
    description: "Failed to verify signature",
    schema: { type: "object", properties: { message: { type: "string" } } },
  })
  @ApiResponse({
    status: 440,
    description: "Signature is expired",
    schema: { type: "object", properties: { message: { type: "string" } } },
  })
  @ApiUnprocessableEntityResponse({
    description: "Signature is invalid",
    schema: { type: "object", properties: { message: { type: "string" } } },
  })
  public async verifySignature(@Body() body: VerifySignatureDto, @Req() req: Request): Promise<boolean> {
    if (!req.session.siwe) {
      throw new BadRequestException({ message: "Message must be requested first" });
    }

    const siweMessage = this.buildSiweMessage(body.message, req);
    const {
      data: message,
      success,
      error,
    } = await siweMessage.verify(
      {
        signature: body.signature,
        nonce: req.session.nonce,
        domain: this.configService.get("appHostname"),
        scheme: this.configService.get("NODE_ENV") === "production" ? "https" : "http",
      },
      { suppressExceptions: true }
    );

    if (!success) {
      req.session = null;
      switch (error.type) {
        case SiweErrorType.EXPIRED_MESSAGE:
          throw new HttpException({ message: error.type }, 440);
        case SiweErrorType.INVALID_SIGNATURE:
          throw new UnprocessableEntityException({ message: error.type });
        default:
          throw new BadRequestException({ message: "Failed to verify signature" });
      }
    }

    req.session.siwe = message;
    return true;
  }

  @Post("logout")
  @Header("Content-Type", "application/json")
  @ApiNoContentResponse({
    description: "User was logged out successfully",
  })
  public async logout(@Req() req: Request) {
    req.session = null;
  }

  @Post("token")
  @Header("Content-Type", "application/json")
  @ApiOkResponse({
    description: "Token was returned successfully",
    schema: {
      type: "object",
      properties: {
        token: { type: "string" },
        ok: { type: "boolean" },
      },
    },
  })
  public async token(@Req() req: Request) {
    const response = await fetch(`${this.configService.get("PRIVIDIUM_PRIVATE_RPC_URL")}/users`, {
      method: "POST",
      body: JSON.stringify({
        address: req.session.siwe.address,
        secret: this.configService.get("PRIVIDIUM_PRIVATE_RPC_SECRET"),
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new HttpException("Error creating token", 424);
    }

    const data = await response.json();
    const validatedData = this.validatePrivateRpcResponse(data);
    return validatedData;
  }

  @Get("me")
  @Header("Content-Type", "application/json")
  @ApiOkResponse({
    description: "User was returned successfully",
    schema: { type: "object", properties: { address: { type: "string" } } },
  })
  public async me(@Req() req: Request) {
    return { address: req.session.siwe.address };
  }

  private buildSiweMessage(msg: string, req: Request): SiweMessage {
    try {
      return new SiweMessage(msg);
    } catch (_e) {
      req.session = null;
      throw new BadRequestException({ message: "Failed to verify signature" });
    }
  }

  private validatePrivateRpcResponse(response: unknown) {
    const schema = z.object({
      ok: z.literal(true),
      token: z.string().min(1),
    });

    const result = schema.safeParse(response);
    if (!result.success) {
      throw new BadRequestException({ message: "Failed to generate token" });
    }

    return result.data;
  }
}
