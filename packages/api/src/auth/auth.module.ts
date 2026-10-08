import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { ExplorerSessionVerifier } from "./explorerSession";

@Module({
  controllers: [AuthController],
  providers: [{ provide: ExplorerSessionVerifier, useValue: new ExplorerSessionVerifier() }],
  exports: [ExplorerSessionVerifier],
})
export class AuthModule {}
