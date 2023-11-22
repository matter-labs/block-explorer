import { config } from "dotenv";
config();

const { DISABLE_API_SCHEMA_DOCS, DISABLE_BFF_API_SCHEMA_DOCS, DISABLE_EXTERNAL_API } = process.env;

export const swagger = {
  enabled: DISABLE_API_SCHEMA_DOCS !== "true",
  bffEnabled: DISABLE_BFF_API_SCHEMA_DOCS !== "true",
};

export const disableExternalAPI = DISABLE_EXTERNAL_API === "true";
