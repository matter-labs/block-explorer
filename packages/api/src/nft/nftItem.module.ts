import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NftItem } from "./nftItem.entity";
@Module({
  imports: [TypeOrmModule.forFeature([NftItem])],
})
export class NftItemModule {}
