import { Module, Logger, MiddlewareConsumer, NestModule, DynamicModule, Inject } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { ApiModule } from "./api/api.module";
import { ApiBlockModule } from "./api/block/block.module";
import { ApiAccountModule } from "./api/account/account.module";
import { ApiContractModule } from "./api/contract/contract.module";
import { ApiTransactionModule } from "./api/transaction/transaction.module";
import { ApiLogModule } from "./api/log/log.module";
import { ApiTokenModule } from "./api/token/token.module";
import { ApiStatsModule } from "./api/stats/stats.module";
import { TokenModule } from "./token/token.module";
import { BlockModule } from "./block/block.module";
import { AddressModule } from "./address/address.module";
import { BalanceModule } from "./balance/balance.module";
import { TransferModule } from "./transfer/transfer.module";
import { TransactionModule } from "./transaction/transaction.module";
import { LogModule } from "./log/log.module";
import { StatsModule } from "./stats/stats.module";
import { MetricsMiddleware } from "./middlewares/metrics.middleware";
import { metricProviders } from "./metrics";
import { DbMetricsService } from "./dbMetrics.service";
import { disableExternalAPI } from "./config/featureFlags";
import config from "./config";
import { applyPrividiumMiddlewares, PRIVIDIUM_MODULES } from "./prividium";

const PRIVIDIUM_TOKEN = "PRIVIDIUM";

interface AppModuleConfig {
  prividium?: boolean;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get<TypeOrmModuleOptions>("typeORM"),
      inject: [ConfigService],
    }),
    TokenModule,
    AddressModule,
    BalanceModule,
    BlockModule,
    TransferModule,
    TransactionModule,
    LogModule,
    StatsModule,
    HealthModule,
  ],
  providers: [Logger, ...metricProviders, DbMetricsService],
})
export class AppModule implements NestModule {
  private prividium?: boolean;

  constructor(@Inject(PRIVIDIUM_TOKEN) moduleConfig: AppModuleConfig) {
    this.prividium = moduleConfig.prividium;
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes("*");

    if (this.prividium) {
      applyPrividiumMiddlewares(consumer);
    }
  }

  // Factory method to be able to include or exclude Prividium modules
  static build({ prividium }: AppModuleConfig = {}): DynamicModule {
    // Notice that values in DynamicModules extend the base module instead of override,
    // as explained here: https://docs.nestjs.com/modules#dynamic-modules
    return {
      module: AppModule,
      providers: [
        {
          provide: PRIVIDIUM_TOKEN,
          useValue: {
            prividium,
          },
        },
      ],
      imports: [
        /// Only enable prividium modules for prividium chains
        ...(prividium ? PRIVIDIUM_MODULES : []),
        ...(disableExternalAPI
          ? []
          : [
              ApiModule,
              ApiContractModule,
              ApiBlockModule,
              ApiAccountModule,
              ApiTransactionModule,
              ApiLogModule,
              ApiTokenModule,
              ApiStatsModule,
            ]),
      ],
    };
  }
}
