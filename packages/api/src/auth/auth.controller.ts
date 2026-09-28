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
import { VerifySignatureDto, SwitchWalletDto } from "./auth.dto";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import { PrividiumApiError } from "../errors/prividiumApiError";
import { parseUserProfile } from "../api/pipes/addUserRoles.pipe";
import { NO_WALLET_VIEWER } from "../common/constants";

const entityName = "auth";
const userWalletsSchema = z.object({ wallets: z.array(z.string()) });
const currentSessionSchema = z.object({
  type: z.string(),
  expiresAt: z.string().datetime(),
});

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
  public async login(
    @Body() body: VerifySignatureDto,
    @Req() req: Request
  ): Promise<{ address: string | null; wallets: string[]; hasFullReadAccess: boolean; hasAdminRead: boolean }> {
    try {
      const [wallets, sessionExpirationIso, { hasFullReadAccess, hasAdminRead }] = await Promise.all([
        this.fetchUserWallets(body.token),
        this.fetchExpirationTimeIso(body.token),
        this.fetchUserProfile(body.token),
      ]);

      // Store all wallets and use first address as default
      const address = wallets[0] ?? NO_WALLET_VIEWER;
      req.session.wallets = wallets;
      req.session.address = address;
      req.session.token = body.token;
      req.session.hasFullReadAccess = hasFullReadAccess;
      req.session.hasAdminRead = hasAdminRead;
      req.session.expiresAt = sessionExpirationIso;
      return {
        address: address === NO_WALLET_VIEWER ? null : address,
        wallets,
        hasFullReadAccess,
        hasAdminRead,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error("Login error:", error);
      throw new InternalServerErrorException("Authentication failed");
    }
  }

  @Post("switch-wallet")
  @Header("Content-Type", "application/json")
  @ApiOkResponse({
    description: "Wallet switched successfully",
    schema: { type: "object", properties: { address: { type: "string" } } },
  })
  @ApiForbiddenResponse({
    description: "Wallet not authorized for this user",
  })
  public async switchWallet(@Body() body: SwitchWalletDto, @Req() req: Request): Promise<{ address: string }> {
    // Validate that the requested wallet belongs to the user
    if (!req.session.wallets || !req.session.wallets.map((w) => w.toLowerCase()).includes(body.address.toLowerCase())) {
      throw new HttpException("Wallet not authorized for this user", 403);
    }

    // Update the current address in session
    req.session.address = body.address;
    return { address: body.address };
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
    schema: {
      type: "object",
      properties: {
        address: { type: "string", nullable: true },
        wallets: { type: "array", items: { type: "string" } },
      },
    },
  })
  public async me(@Req() req: Request) {
    return {
      address: req.session.address === NO_WALLET_VIEWER ? null : req.session.address,
      wallets: req.session.wallets,
      hasFullReadAccess: req.session.hasFullReadAccess ?? false,
      hasAdminRead: req.session.hasAdminRead ?? false,
    };
  }

  private clearSession(req: Request) {
    req.session = null;
  }

  private async fetchUserWallets(token: string) {
    const response = await fetch(new URL("/api/user-wallets", this.configService.get("prividium.permissionsApiUrl")), {
      headers: { Authorization: `Bearer ${token}` },
    });

    // If user wallets cannot be fetched, that user cannot log in to the system
    if (response.status === 403 || response.status === 401) {
      throw new PrividiumApiError("Invalid or expired token", 403);
    }

    const data = await response.json();
    const validatedData = userWalletsSchema.safeParse(data);
    if (!validatedData.success) {
      throw new Error(`Invalid response from permissions API: ${JSON.stringify(validatedData.error)}`);
    }

    return validatedData.data.wallets;
  }

  private async fetchUserProfile(token: string): Promise<{ hasFullReadAccess: boolean; hasAdminRead: boolean }> {
    const response = await fetch(new URL("/api/profiles/me", this.configService.get("prividium.permissionsApiUrl")), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403 || response.status === 401) {
      throw new PrividiumApiError("Invalid or expired token", 403);
    }

    return parseUserProfile(await response.json());
  }

  private async fetchExpirationTimeIso(token: string): Promise<string> {
    const response = await fetch(
      new URL("/api/auth/current-session", this.configService.get("prividium.permissionsApiUrl")),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // If user token expiration cannot be fetch user cannot log in to the system.
    if (response.status !== 200) {
      throw new PrividiumApiError("Invalid or expired token", 403);
    }

    const data = await response.json();
    const validatedData = currentSessionSchema.safeParse(data);
    if (!validatedData.success) {
      throw new Error(`Invalid response from permissions API: ${JSON.stringify(validatedData.error)}`);
    }

    return validatedData.data.expiresAt;
  }
}
