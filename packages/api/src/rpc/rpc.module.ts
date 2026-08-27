import { Module } from "@nestjs/common";
import { RpcController } from "./rpc.controller";

@Module({
  controllers: [RpcController],
})
export class RpcModule {}
