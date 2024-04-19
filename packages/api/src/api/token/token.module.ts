import { Module } from "@nestjs/common";
import { TokenController } from "./token.controller";
import { TokenModule } from "../../token/token.module";

@Module({
  imports: [TokenModule],
  controllers: [TokenController],
})
export class ApiTokenModule {}
