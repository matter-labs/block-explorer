import { createHash } from "crypto";
import { Logger } from "@nestjs/common";
import { z } from "zod";
import { PrividiumApiError } from "../errors/prividiumApiError";

// The perpetual OAuth client the explorer logs in as; fixed on both sides, so no env var.
export const BLOCK_EXPLORER_OAUTH_CLIENT_ID = "block-explorer";

const currentSessionSchema = z.object({
  type: z.string(),
  expiresAt: z.string().datetime(),
  // Absent on a permissions API that predates application-scoped sessions.
  oauthClientId: z.string().nullish(),
});

export type ExplorerSession = { expiresAt: string };

const logger = new Logger("ExplorerSession");

/**
 * Resolves only for a user session issued to the explorer itself or the user's account session. A token minted for
 * another application ("Login with Prividium") acts as the user on the permissions API, but it is not an explorer
 * credential.
 */
export async function fetchExplorerSession(permissionsApiUrl: string, token: string): Promise<ExplorerSession> {
  const response = await fetch(new URL("/api/auth/current-session", permissionsApiUrl), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status !== 200) {
    throw new PrividiumApiError("Invalid or expired token", 403);
  }

  const validatedData = currentSessionSchema.safeParse(await response.json());
  if (!validatedData.success) {
    throw new Error(`Invalid response from permissions API: ${JSON.stringify(validatedData.error)}`);
  }

  const { type, oauthClientId, expiresAt } = validatedData.data;
  const issuedToExplorer = oauthClientId == null || oauthClientId === BLOCK_EXPLORER_OAUTH_CLIENT_ID;
  if (type !== "user" || !issuedToExplorer) {
    logger.warn(`Rejected a ${type} session issued to ${oauthClientId ?? "the account"}`);
    throw new PrividiumApiError("Token was not issued for the block explorer", 403);
  }

  return { expiresAt };
}

const VERDICT_TTL_MS = 5 * 60 * 1000;
const MAX_VERIFIED_TOKENS = 10_000;

/**
 * Remembers which tokens were issued to the explorer, so a token is verified once rather than on every request.
 * Safe to cache: a session's type and client never change after issue, and expiry and revocation are still
 * enforced per request by the uncached profile lookup.
 */
export class ExplorerSessionVerifier {
  private readonly verifiedUntil = new Map<string, number>();

  constructor(private readonly maxEntries = MAX_VERIFIED_TOKENS, private readonly ttlMs = VERDICT_TTL_MS) {}

  async assert(permissionsApiUrl: string, token: string): Promise<void> {
    const key = createHash("sha256").update(token).digest("hex");
    const cachedUntil = this.verifiedUntil.get(key);
    if (cachedUntil !== undefined && cachedUntil > Date.now()) {
      return;
    }
    this.verifiedUntil.delete(key);

    const { expiresAt } = await fetchExplorerSession(permissionsApiUrl, token);
    this.remember(key, Math.min(Date.parse(expiresAt), Date.now() + this.ttlMs));
  }

  private remember(key: string, until: number) {
    if (this.verifiedUntil.size >= this.maxEntries) {
      const oldest = this.verifiedUntil.keys().next().value;
      this.verifiedUntil.delete(oldest);
    }
    this.verifiedUntil.set(key, until);
  }
}
