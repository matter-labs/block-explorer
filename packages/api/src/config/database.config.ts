export interface DatabaseConfig {
  url: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

const DEFAULT_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5432/block-explorer";

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  // First priority: DATABASE_URL
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  // Second priority: Individual env vars
  if (env.DATABASE_HOST || env.DATABASE_USER || env.DATABASE_PASSWORD || env.DATABASE_NAME) {
    const host = env.DATABASE_HOST || "localhost";
    const port = parseInt(env.DATABASE_PORT) || 5432;
    const username = env.DATABASE_USER || "postgres";
    const password = env.DATABASE_PASSWORD || "postgres";
    const database = env.DATABASE_NAME || "block-explorer";

    let dbUrl = `postgres://${username}:${password}@${host}:${port}/${database}`;

    // Add SSL parameters if specified
    if (env.DATABASE_ENABLE_SSL === "true") {
      const sslMode = env.DATABASE_SSL_MODE || "require";
      dbUrl += `?ssl=true&sslmode=${sslMode}`;
      if (env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false") {
        dbUrl += "&rejectUnauthorized=false";
      }
    }

    return dbUrl;
  }

  // Fallback: Default URL
  return DEFAULT_DATABASE_URL;
}

export function getDatabaseSSLConfig(
  env: NodeJS.ProcessEnv = process.env
): boolean | { rejectUnauthorized: boolean } | undefined {
  if (env.DATABASE_ENABLE_SSL === "true") {
    if (env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false") {
      return { rejectUnauthorized: false };
    }
    return true;
  }
  return undefined;
}

export function parseDatabaseUrl(url: string): DatabaseConfig {
  const urlObj = new URL(url);

  return {
    url,
    host: urlObj.hostname,
    port: parseInt(urlObj.port) || 5432,
    username: urlObj.username,
    password: urlObj.password,
    database: urlObj.pathname.slice(1), // Remove leading '/'
  };
}

export function getDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const url = getDatabaseUrl(env);
  const config = parseDatabaseUrl(url);
  const ssl = getDatabaseSSLConfig(env);
  if (ssl !== undefined) {
    config.ssl = ssl;
  }
  return config;
}

export interface DatabaseConnectionOptions {
  url: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export function getDatabaseConnectionOptions(env: NodeJS.ProcessEnv = process.env): DatabaseConnectionOptions {
  const url = getDatabaseUrl(env);
  const ssl = getDatabaseSSLConfig(env);

  return {
    url,
    ...(ssl !== undefined && { ssl }),
  };
}
