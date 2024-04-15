import { Module } from "@nestjs/common";
import { TokenController } from "./token.controller";
import { TokenModule } from "../../token/token.module";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [TokenModule, HttpModule],
  controllers: [TokenController],
})
export class ApiTokenModule {}
