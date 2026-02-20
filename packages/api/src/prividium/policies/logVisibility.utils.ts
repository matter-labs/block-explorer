import { SelectQueryBuilder } from "typeorm";

export const logQueryForDebug = (qb: SelectQueryBuilder<unknown>) => {
  try {
    const sql = buildExecutableSql(qb);
    console.debug(`=== SQL debug ===\n${sql}\n-------------`);
  } catch {
    console.warn("Failed to build prividium log visibility SQL");
  }
};

const buildExecutableSql = (qb: SelectQueryBuilder<unknown>): string => {
  const [query, parameters] = qb.getQueryAndParameters();

  if (/\$\d+/.test(query)) {
    const sql = query.replace(/\$(\d+)/g, (_match, index) => {
      return toSqlLiteral(parameters[Number(index) - 1]);
    });

    return ensureTrailingSemicolon(sql);
  }

  if (query.includes("?")) {
    let parameterIndex = 0;
    const sql = query.replace(/\?/g, () => {
      const value = parameters[parameterIndex];
      parameterIndex += 1;
      return toSqlLiteral(value);
    });

    return ensureTrailingSemicolon(sql);
  }

  return ensureTrailingSemicolon(query);
};

const ensureTrailingSemicolon = (query: string): string => {
  const trimmedQuery = query.trim();
  return trimmedQuery.endsWith(";") ? trimmedQuery : `${trimmedQuery};`;
};

const toSqlLiteral = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (Buffer.isBuffer(value)) {
    return toByteaLiteral(value);
  }

  if (value instanceof Uint8Array) {
    return toByteaLiteral(value);
  }

  if (isSerializedBuffer(value)) {
    return toByteaLiteral(Buffer.from(value.data));
  }

  if (Array.isArray(value)) {
    return `(${value.map((item) => toSqlLiteral(item)).join(", ")})`;
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  if (typeof value === "string") {
    return `'${value.replace(/'/g, "''")}'`;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : "NULL";
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  const serialized = JSON.stringify(value);
  return serialized ? `'${serialized.replace(/'/g, "''")}'` : "NULL";
};

const isSerializedBuffer = (value: unknown): value is { type: "Buffer"; data: number[] } => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const typedValue = value as { type?: unknown; data?: unknown };
  return typedValue.type === "Buffer" && Array.isArray(typedValue.data);
};

const toByteaLiteral = (value: Uint8Array): string => {
  return `decode('${Buffer.from(value).toString("hex")}', 'hex')`;
};
