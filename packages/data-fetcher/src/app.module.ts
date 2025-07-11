import { Module, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import config from "./config";
import { HealthModule } from "./health/health.module";
import { BlockchainService } from "./blockchain";
import { BlockService, BlockController } from "./block";
import { TransactionService } from "./transaction";
import { LogService } from "./log";
import { AddressService } from "./address/address.service";
import { BalanceService } from "./balance";
import { TransferService } from "./transfer/transfer.service";
import { TokenService } from "./token/token.service";
import { JsonRpcProviderModule } from "./rpcProvider/jsonRpcProvider.module";
import { MetricsModule } from "./metrics";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    PrometheusModule.register(),
    JsonRpcProviderModule.forRoot(),
    MetricsModule,
    HealthModule,
  ],
  controllers: [BlockController],
  providers: [
    BlockchainService,
    AddressService,
    BalanceService,
    TransferService,
    TokenService,
    TransactionService,
    LogService,
    BlockService,
    Logger,
  ],
})
export class AppModule {}
