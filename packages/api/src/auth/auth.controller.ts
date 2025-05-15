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

  @Post("message")
  @Header("Content-Type", "text/plain")
  @ApiOkResponse({
    description: "Message was returned successfully",
    schema: { type: "string" },
  })
  public getMessage(@Req() req: Request, @Body() body: { address: string }): string {
    const message = new SiweMessage({
      domain: this.configService.get("appHostname"),
      address: body.address,
      statement: "Sign in to the Block Explorer",
      uri: this.configService.get("appUrl"),
      version: "1",
      chainId: this.configService.get("prividium.chainId"),
      nonce: generateNonce(),
      scheme: this.configService.get("NODE_ENV") === "production" ? "https" : "http",
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour
    });
    req.session.siwe = message;
    return message.prepareMessage();
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

    const siweMessage = new SiweMessage(body.message);
    const {
      data: message,
      success,
      error,
    } = await siweMessage.verify({ signature: body.signature, nonce: req.session.nonce }, { suppressExceptions: true });

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

  @Get("me")
  @Header("Content-Type", "application/json")
  @ApiOkResponse({
    description: "User was returned successfully",
    schema: { type: "object", properties: { address: { type: "string" } } },
  })
  public async me(@Req() req: Request) {
    return { address: req.session.siwe.address };
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
