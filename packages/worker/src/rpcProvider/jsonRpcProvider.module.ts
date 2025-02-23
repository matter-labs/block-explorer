import { Module, DynamicModule, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JsonRpcProviderBase, JsonRpcProviderExtended } from "./index";

@Module({
  providers: [
    Logger,
    {
      provide: JsonRpcProviderBase,
      useFactory: (configService: ConfigService, logger: Logger) => {
        const providerUrl = configService.get<string>("blockchain.rpcUrl");
        const connectionTimeout = configService.get<number>("blockchain.rpcCallConnectionTimeout");
        const connectionQuickTimeout = configService.get<number>("blockchain.rpcCallConnectionQuickTimeout");
        const batchMaxSizeBytes = configService.get<number>("blockchain.rpcBatchMaxSizeBytes");
        const batchMaxCount = configService.get<number>("blockchain.rpcBatchMaxCount");
        const batchStallTimeMs = configService.get<number>("blockchain.rpcBatchStallTimeMs");
        const providerUrlProtocol = new URL(providerUrl).protocol;

        logger.debug(`Initializing RPC provider with the following URL: ${providerUrl}.`, "RpcProviderModule");

        if (providerUrlProtocol === "http:" || providerUrlProtocol === "https:") {
          return new JsonRpcProviderExtended(
            providerUrl,
            connectionTimeout,
            connectionQuickTimeout,
            batchMaxCount,
            batchMaxSizeBytes,
            batchStallTimeMs
          );
        }

        throw new Error(
          `RPC URL protocol is not supported. HTTP(s) URL is expected. Actual protocol: ${providerUrlProtocol}.`
        );
      },
      inject: [ConfigService, Logger],
    },
  ],
  exports: [JsonRpcProviderBase],
})
export class JsonRpcProviderModule {
  static forRoot(): DynamicModule {
    return {
      module: JsonRpcProviderModule,
      global: true,
    };
  }
}
