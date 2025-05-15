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
import { generateNonce, SiweError, SiweErrorType, SiweMessage } from "siwe";
import { Request } from "express";
import { VerifySignatureDto } from "./auth.dto";

const entityName = "auth";

@ApiTags("Auth BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class AuthController {
  @Get("nonce")
  @Header("Content-Type", "text/plain")
  @ApiOkResponse({
    description: "Message was returned successfully",
    schema: { type: "string" },
  })
  public async getNonce(@Req() req: Request): Promise<string> {
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
}
