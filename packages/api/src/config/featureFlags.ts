import { config } from "dotenv";
config();

const { DISABLE_API_SCHEMA_DOCS, DISABLE_BFF_API_SCHEMA_DOCS, DISABLE_EXTERNAL_API, DOUBLE_ZERO } = process.env;

export const swagger = {
  enabled: DISABLE_API_SCHEMA_DOCS !== "true",
  bffEnabled: DISABLE_BFF_API_SCHEMA_DOCS !== "true",
};

export const disableExternalAPI = DISABLE_EXTERNAL_API === "true";

export const doubleZero = DOUBLE_ZERO === "true";
