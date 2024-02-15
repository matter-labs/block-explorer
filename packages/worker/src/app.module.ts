import { Module, Logger } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { HttpModule, HttpService } from "@nestjs/axios";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import config from "./config";
import { HealthModule } from "./health/health.module";
import { AppService } from "./app.service";
import { BlockchainService } from "./blockchain";
import { BlocksRevertService } from "./blocksRevert";
import { BatchService } from "./batch";
import { BlockProcessor, BlockWatcher, BlockService } from "./block";
import { TransactionProcessor } from "./transaction";
import { BalanceService, BalancesCleanerService } from "./balance";
import { TokenService } from "./token/token.service";
import { TokenOffChainDataProvider } from "./token/tokenOffChainData/tokenOffChainDataProvider.abstract";
import { CoingeckoTokenOffChainDataProvider } from "./token/tokenOffChainData/providers/coingecko/coingeckoTokenOffChainDataProvider";
import { PortalsFiTokenOffChainDataProvider } from "./token/tokenOffChainData/providers/portalsFi/portalsFiTokenOffChainDataProvider";
import { TokenOffChainDataSaverService } from "./token/tokenOffChainData/tokenOffChainDataSaver.service";
import { CounterModule } from "./counter/counter.module";
import {
  BatchRepository,
  BlockRepository,
  TransactionRepository,
  AddressTransactionRepository,
  TransactionReceiptRepository,
  TokenRepository,
  AddressRepository,
  TransferRepository,
  AddressTransferRepository,
  LogRepository,
  BalanceRepository,
} from "./repositories";
import {
  Batch,
  Block,
  Transaction,
  AddressTransaction,
  TransactionReceipt,
  Log,
  Token,
  Address,
  Transfer,
  AddressTransfer,
  Balance,
} from "./entities";
import { typeOrmModuleOptions } from "./typeorm.config";
import { JsonRpcProviderModule } from "./rpcProvider/jsonRpcProvider.module";
import { RetryDelayProvider } from "./retryDelay.provider";
import { MetricsModule } from "./metrics";
import { DbMetricsService } from "./dbMetrics.service";
import { UnitOfWorkModule } from "./unitOfWork";
import { DataFetcherService } from "./dataFetcher/dataFetcher.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    PrometheusModule.register(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        return {
          ...typeOrmModuleOptions,
          autoLoadEntities: true,
          retryDelay: 3000, // to cover 3 minute DB failover window
          retryAttempts: 70, // try to reconnect for 3.5 minutes,
        };
      },
    }),
    TypeOrmModule.forFeature([
      Batch,
      Block,
      Transaction,
      AddressTransaction,
      TransactionReceipt,
      Log,
      Token,
      Address,
      AddressTransfer,
      Transfer,
      Balance,
    ]),
    EventEmitterModule.forRoot(),
    JsonRpcProviderModule.forRoot(),
    MetricsModule,
    UnitOfWorkModule,
    CounterModule,
    HealthModule,
    HttpModule,
  ],
  providers: [
    AppService,
    BlockchainService,
    DataFetcherService,
    BalanceService,
    BalancesCleanerService,
    TokenService,
    {
      provide: TokenOffChainDataProvider,
      useFactory: (configService: ConfigService, httpService: HttpService) => {
        const selectedProvider = configService.get<string>("tokens.selectedTokenOffChainDataProvider");
        switch (selectedProvider) {
          case "portalsFi":
            return new PortalsFiTokenOffChainDataProvider(httpService);
          default:
            return new CoingeckoTokenOffChainDataProvider(configService, httpService);
        }
      },
      inject: [ConfigService, HttpService],
    },
    TokenOffChainDataSaverService,
    BatchRepository,
    BlockRepository,
    TransactionRepository,
    AddressTransactionRepository,
    TransactionReceiptRepository,
    TokenRepository,
    AddressRepository,
    TransferRepository,
    AddressTransferRepository,
    BalanceRepository,
    LogRepository,
    BlocksRevertService,
    BatchService,
    BlockProcessor,
    TransactionProcessor,
    BlockWatcher,
    BlockService,
    Logger,
    RetryDelayProvider,
    DbMetricsService,
  ],
})
export class AppModule {}
