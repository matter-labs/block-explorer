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
import { BatchModule } from "./batch/batch.module";
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
import { disableExternalAPI, privateValidium } from "./config/featureFlags";
import config from "./config";
import { applyPrivateValidiumMiddlewares, PRIVATE_VALIDIUM_MODULES } from "./private-validium";

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
    BatchModule,
    BlockModule,
    TransferModule,
    TransactionModule,
    LogModule,
    StatsModule,
    HealthModule,
    ...(privateValidium ? PRIVATE_VALIDIUM_MODULES : []),
  ],
  providers: [Logger, ...metricProviders, DbMetricsService],
})
export class AppModule implements NestModule {
  private prividium?: boolean;

  constructor(@Inject(PRIVIDIUM_TOKEN) moduleConfig: AppModuleConfig, allConfigs: ConfigService) {
    this.prividium = moduleConfig.prividium;

    if (this.prividium) {
      const schema = z.object({
        privateRpcUrl: z.string().url(),
        privateRpcSecret: z.string().min(1),
      });
      const result = schema.safeParse(allConfigs.get("prividium"));
      if (!result.success) {
        throw new Error("Invalid Prividium config");
      }
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes("*");

    if (privateValidium) {
      applyPrivateValidiumMiddlewares(consumer);
    }
  }
}
