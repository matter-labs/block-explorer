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

class ForeignSessionError extends PrividiumApiError {
  constructor(readonly expiresAt: string) {
    super("Token was not issued for the block explorer", 403);
  }
}

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
    throw new ForeignSessionError(expiresAt);
  }

  return { expiresAt };
}

const MAX_CACHED_TOKENS = 10_000;

/**
 * Remembers accepted and foreign audiences until expiry to avoid repeating the same upstream check.
 * Caching preserves the existing live authorization checks; only the immutable session audience is cached.
 */
export class ExplorerSessionVerifier {
  private readonly verdicts = new Map<string, ExplorerSession | ForeignSessionError>();
  private readonly pending = new Map<string, Promise<ExplorerSession>>();

  constructor(private readonly maxEntries = MAX_CACHED_TOKENS) {}

  /** Fetches the current expiry on login, unless the token is already known to belong to another application. */
  async establish(permissionsApiUrl: string, token: string): Promise<ExplorerSession> {
    const key = hashToken(token);
    this.cachedVerdictOrThrow(key);
    return this.fetchShared(permissionsApiUrl, token, key);
  }

  async verify(permissionsApiUrl: string, token: string): Promise<void> {
    const key = hashToken(token);
    if (this.cachedVerdictOrThrow(key) === undefined) {
      await this.fetchShared(permissionsApiUrl, token, key);
    }
  }

  private cachedVerdictOrThrow(key: string): ExplorerSession | undefined {
    const cached = this.verdicts.get(key);
    if (cached !== undefined && Date.parse(cached.expiresAt) > Date.now()) {
      if (cached instanceof ForeignSessionError) {
        throw cached;
      }
      return cached;
    }
    this.verdicts.delete(key);
    return undefined;
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
    try {
      const session = await fetchExplorerSession(permissionsApiUrl, token);
      this.remember(key, session);
      return session;
    } catch (error) {
      if (error instanceof ForeignSessionError) {
        this.remember(key, error);
      }
      throw error;
    }
  }

  private remember(key: string, verdict: ExplorerSession | ForeignSessionError): void {
    this.verdicts.delete(key);
    if (this.verdicts.size >= this.maxEntries) {
      const oldest = this.verdicts.keys().next().value;
      this.verdicts.delete(oldest);
    }
    this.verdicts.set(key, verdict);
  }
}

// Session tokens are random, so a fast hash is enough for a cache key.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
