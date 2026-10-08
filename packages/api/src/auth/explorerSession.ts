import { createHash } from "crypto";
import { Logger } from "@nestjs/common";
import { z } from "zod";
import { PrividiumApiError } from "../errors/prividiumApiError";

// The perpetual OAuth client the explorer logs in as; fixed on both sides, so no env var.
const BLOCK_EXPLORER_OAUTH_CLIENT_ID = "block-explorer";

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

  if (response.status === 401 || response.status === 403) {
    throw new PrividiumApiError("Invalid or expired token", 403);
  }
  if (response.status !== 200) {
    throw new Error(`Unexpected ${response.status} response from permissions API`);
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

const MAX_VERIFIED_TOKENS = 10_000;

/**
 * Remembers which tokens were issued to the explorer, so a token is verified once rather than on every request.
 * Safe to cache: a session's type and client never change after issue, and expiry and revocation are still
 * enforced per request by the uncached profile lookup.
 */
export class ExplorerSessionVerifier {
  private readonly verified = new Map<string, ExplorerSession>();
  private readonly pending = new Map<string, Promise<ExplorerSession>>();

  constructor(private readonly maxEntries = MAX_VERIFIED_TOKENS) {}

  /** Always fetches, so a login stores the session's current expiry, and remembers the verdict. */
  establish(permissionsApiUrl: string, token: string): Promise<ExplorerSession> {
    return this.fetchShared(permissionsApiUrl, token, hashToken(token));
  }

  async verify(permissionsApiUrl: string, token: string): Promise<void> {
    const key = hashToken(token);
    const cached = this.verified.get(key);
    if (cached !== undefined && Date.parse(cached.expiresAt) > Date.now()) {
      return;
    }
    this.verified.delete(key);
    await this.fetchShared(permissionsApiUrl, token, key);
  }

  // Concurrent requests with the same token share one upstream call.
  private fetchShared(permissionsApiUrl: string, token: string, key: string): Promise<ExplorerSession> {
    let verification = this.pending.get(key);
    if (verification === undefined) {
      verification = this.fetchAndRemember(permissionsApiUrl, token, key).finally(() => this.pending.delete(key));
      this.pending.set(key, verification);
    }
    return verification;
  }

  private async fetchAndRemember(permissionsApiUrl: string, token: string, key: string): Promise<ExplorerSession> {
    const session = await fetchExplorerSession(permissionsApiUrl, token);
    if (this.verified.size >= this.maxEntries) {
      const oldest = this.verified.keys().next().value;
      this.verified.delete(oldest);
    }
    this.verified.set(key, session);
    return session;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
