import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IndexerState } from "./indexerState.entity";
import { IndexerStateService } from "./indexerState.service";

@Module({
  imports: [TypeOrmModule.forFeature([IndexerState])],
  providers: [IndexerStateService],
  exports: [IndexerStateService],
})
export class IndexerStateModule {}
