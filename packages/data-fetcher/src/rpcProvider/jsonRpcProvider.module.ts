import { Module, DynamicModule, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JsonRpcProviderBase, JsonRpcProviderExtended, WrappedWebSocketProvider } from "./index";

@Module({
  providers: [
    Logger,
    {
      provide: JsonRpcProviderBase,
      useFactory: (configService: ConfigService, logger: Logger) => {
        const providerUrl = configService.get<string>("blockchain.rpcUrl");
        const connectionTimeout = configService.get<number>("blockchain.rpcCallConnectionTimeout");
        const connectionQuickTimeout = configService.get<number>("blockchain.rpcCallConnectionQuickTimeout");
        const providerUrlProtocol = new URL(providerUrl).protocol;

        logger.debug(`Initializing RPC provider with the following URL: ${providerUrl}.`, "RpcProviderModule");

        if (providerUrlProtocol === "http:" || providerUrlProtocol === "https:") {
          return new JsonRpcProviderExtended(providerUrl, connectionTimeout, connectionQuickTimeout);
        }

        throw new Error(
          `RPC URL protocol is not supported. HTTP(s) URL is expected. Actual protocol: ${providerUrlProtocol}.`
        );
      },
      inject: [ConfigService, Logger],
    },
    {
      provide: WrappedWebSocketProvider,
      useFactory: (configService: ConfigService, logger: Logger) => {
        const providerUrl = configService.get<string>("blockchain.wsRpcUrl");
        const connectionTimeout = configService.get<number>("blockchain.rpcCallConnectionTimeout");
        const connectionQuickTimeout = configService.get<number>("blockchain.rpcCallConnectionQuickTimeout");
        const maxConnections = configService.get<number>("blockchain.wsMaxConnections");
        const useWebSocketsForTransactions = configService.get<boolean>("blockchain.useWebSocketsForTransactions");

        if (!useWebSocketsForTransactions) {
          return null;
        }

        logger.debug(`Initializing WS RPC provider with the following URL: ${providerUrl}.`, "RpcProviderModule");

        return new WrappedWebSocketProvider(providerUrl, connectionTimeout, connectionQuickTimeout, maxConnections);
      },
      inject: [ConfigService, Logger],
    },
  ],
  exports: [JsonRpcProviderBase, WrappedWebSocketProvider],
})
export class JsonRpcProviderModule {
  static forRoot(): DynamicModule {
    return {
      module: JsonRpcProviderModule,
      global: true,
    };
  }
}
