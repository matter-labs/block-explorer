import { Module, Logger, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { ApiModule } from "./api/api.module";
import { ApiBlockModule } from "./api/block/block.module";
import { ApiAccountModule } from "./api/account/account.module";
import { ApiContractModule } from "./api/contract/contract.module";
import { ApiTransactionModule } from "./api/transaction/transaction.module";
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
import config from "./config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get<TypeOrmModuleOptions>("typeORM"),
      inject: [ConfigService],
    }),
    ApiModule,
    ApiBlockModule,
    ApiAccountModule,
    ApiContractModule,
    ApiTransactionModule,
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
  ],
  providers: [Logger, ...metricProviders, DbMetricsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes("*");
  }
}
