import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LogService } from "./log.service";
import { Log } from "./log.entity";
import { LOG_AUGMENTOR, PrividiumLogAugmentor, StandardLogAugmentor } from "./log.tokens";
import { makePrividiumToggleProvider } from "../prividium/prividium-provider.factory";

@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  providers: [
    LogService,
    StandardLogAugmentor,
    PrividiumLogAugmentor,
    makePrividiumToggleProvider(LOG_AUGMENTOR, StandardLogAugmentor, PrividiumLogAugmentor),
  ],
  exports: [LogService],
})
export class LogModule {}
