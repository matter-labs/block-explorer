import { readdirSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { prompt } from "enquirer";
import * as dotenv from "dotenv";
import { parse as parseConnectionString } from "pg-connection-string";

const buildAppConfig = (zkSyncEnvs: { [key: string]: string }) => ({
  networks: [{
    apiUrl: "http://localhost:3020",
    verificationApiUrl: zkSyncEnvs.API_CONTRACT_VERIFICATION_URL || "",
    hostnames: ["localhost"],
    icon: "/images/icons/zksync-arrows.svg",
    l2ChainId: parseInt(zkSyncEnvs.CHAIN_ETH_ZKSYNC_NETWORK_ID, 10) || "",
    l2NetworkName: zkSyncEnvs.CHAIN_ETH_ZKSYNC_NETWORK || "",
    bridgeUrl: "http://localhost:3000/bridge",
    l2WalletUrl: "http://localhost:3000",
    maintenance: false,
    name: zkSyncEnvs.CHAIN_ETH_ZKSYNC_NETWORK || "",
    published: true,
    rpcUrl: zkSyncEnvs.API_WEB3_JSON_RPC_HTTP_URL || "",
  }]
});

const buildDataFetcherConfig = (zkSyncEnvs: { [key: string]: string }) => {
  return {
    BLOCKCHAIN_RPC_URL: zkSyncEnvs.API_WEB3_JSON_RPC_HTTP_URL || "",
  }
};

const buildWorkerConfig = (zkSyncEnvs: { [key: string]: string }) => {
  const dbConfig = parseConnectionString(zkSyncEnvs.DATABASE_URL);
  return {
    BLOCKCHAIN_RPC_URL: zkSyncEnvs.API_WEB3_JSON_RPC_HTTP_URL || "",
    DATABASE_HOST: dbConfig.host || "",
    DATABASE_USER: dbConfig.user || "",
    DATABASE_PASSWORD: dbConfig.password || "",
    DATABASE_NAME: "block-explorer",
    DATA_FETCHER_URL: "http://localhost:3040",
  }
};

const buildApiConfig = (zkSyncEnvs: { [key: string]: string }) => {
  const dbConfig = parseConnectionString(zkSyncEnvs.DATABASE_URL);
  return {
    DATABASE_URL: `postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}/block-explorer`,
    CONTRACT_VERIFICATION_API_URL: zkSyncEnvs.API_CONTRACT_VERIFICATION_URL || "",
  }
};

const buildEnvFileContent = (json: { [key: string]: string | number }) => Object.keys(json).map(envName => `${envName}=${json[envName]}`).join("\n");

(async () => {
  const zkSyncHome = process.env.ZKSYNC_HOME;
  if (!zkSyncHome) {
    console.error("Please set ZKSYNC_HOME environment variable to contain path to your zksync-era repo.");
    process.exit(1);
  }
  console.log(`zksync-era repo found at ${zkSyncHome}`);

  const zkSyncEnvFolder = `${zkSyncHome}/etc/env`;
  const envFiles = readdirSync(zkSyncEnvFolder)
    .map((fullFileName) => path.parse(fullFileName))
    .filter((file) => {
      if (!file.ext.endsWith(".env")) return false;
      if (!file.name) return false;
      if (file.base === ".init.env") return false;
      return true;
    })
    .map((file) => file.name);
  if (!envFiles.length) {
    console.error("No environment files found in your zksync-era repo. Please set up your hyperchain first.");
    process.exit(1);
  }
  const { selectedEnv }: { selectedEnv: string } = await prompt([
    {
      message: "Which environment do you want to use?",
      name: "selectedEnv",
      type: "select",
      choices: envFiles,
    },
  ]);
  const selectedEnvFilePath = path.join(zkSyncEnvFolder, `${selectedEnv}.env`);

  const envs = dotenv.parse(readFileSync(selectedEnvFilePath));
  const appConfig = buildAppConfig(envs);
  const workerConfig = buildWorkerConfig(envs);
  const dataFetcherConfig = buildDataFetcherConfig(envs);
  const apiConfig = buildApiConfig(envs);

  writeFileSync(path.join(__dirname, "../packages/app/src/configs/hyperchain.config.json"), JSON.stringify(appConfig, null, 2));
  console.log("Updated app config at app/src/configs/hyperchain.config.json");

  writeFileSync(path.join(__dirname, "../packages/data-fetcher/.env"), buildEnvFileContent(dataFetcherConfig));
  console.log("Updated data-fetcher env file at data-fetcher/.env");

  writeFileSync(path.join(__dirname, "../packages/worker/.env"), buildEnvFileContent(workerConfig));
  console.log("Updated worker env file at worker/.env");

  writeFileSync(path.join(__dirname, "../packages/api/.env"), buildEnvFileContent(apiConfig));
  console.log("Updated api env file at api/.env");
})();
