import { Module } from "@nestjs/common";
import { ApiController } from "./api.controller";

@Module({
  controllers: [ApiController],
})
export class ApiModule {}
