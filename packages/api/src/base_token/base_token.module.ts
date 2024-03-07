import { Module } from "@nestjs/common";
import { BaseTokenService } from "./base_token.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  exports: [BaseTokenService],
  providers: [BaseTokenService],
})
export class BaseTokenModule {}
