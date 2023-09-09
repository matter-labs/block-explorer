import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BlockService } from "../block/block.service";
import { BlockController } from "./block.controller";
import { Block } from "./block.entity";
import { BlockDetail } from "./blockDetail.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Block, BlockDetail])],
  controllers: [BlockController],
  providers: [BlockService],
  exports: [BlockService],
})
export class BlockModule {}
