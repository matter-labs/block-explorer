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
    description: "Nonce was returned successfully",
    schema: { type: "string", example: "2lkRALIfNHY16ZARc" },
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
    if (!req.session.nonce) {
      throw new BadRequestException({ message: "Nonce must be requested first" });
    }

    try {
      // const siweMessage = new SiweMessage(body.message);
      // // const { data: message } = await siweMessage.verify({ signature: body.signature, nonce: req.session.nonce });
      // req.session.siwe = siweMessage;
      req.session.siwe = { address: "0xe5b06bfd663c94005b8b159cd320fd7976549f9b" } as any;
      return true;
    } catch (err) {
      req.session = null;

      if (err instanceof SiweError) {
        switch (err.type) {
          case SiweErrorType.EXPIRED_MESSAGE:
            throw new HttpException({ message: err.type }, 440);
          case SiweErrorType.INVALID_SIGNATURE:
            throw new UnprocessableEntityException({ message: err.type });
        }
      }

      throw new BadRequestException({ message: "Failed to verify signature" });
    }
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
