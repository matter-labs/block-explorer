import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AddressModule } from "../../address/address.module";
import { ContractController } from "./contract.controller";

@Module({
  imports: [AddressModule, HttpModule],
  controllers: [ContractController],
})
export class ApiContractModule {}
