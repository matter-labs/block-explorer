import { Module } from "@nestjs/common";
import { BlockModule } from "../../block/block.module";
import { BlockController } from "./block.controller";

@Module({
  imports: [BlockModule],
  controllers: [BlockController],
})
export class ApiBlockModule {}
