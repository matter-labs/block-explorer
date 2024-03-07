import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TokenController } from "./token.controller";
import { TokenService } from "./token.service";
import { Token } from "./token.entity";
import { Block } from "../block/block.entity";
import { Transaction } from "../transaction/entities/transaction.entity";
import { TransferModule } from "../transfer/transfer.module";
import { BaseTokenModule } from "../base_token/base_token.module";
@Module({
  imports: [TypeOrmModule.forFeature([Token, Block, Transaction]), TransferModule, BaseTokenModule],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
