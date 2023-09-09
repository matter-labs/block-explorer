import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BatchService } from "../batch/batch.service";
import { BatchController } from "./batch.controller";
import { Batch } from "./batch.entity";
import { BatchDetails } from "./batchDetails.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Batch, BatchDetails])],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {}
