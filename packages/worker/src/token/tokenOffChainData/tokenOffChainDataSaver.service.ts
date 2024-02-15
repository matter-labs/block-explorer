import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "../../common/worker";
import waitFor from "../../utils/waitFor";
import { TokenRepository } from "../../repositories/token.repository";
import { TokenOffChainDataProvider } from "./tokenOffChainDataProvider.abstract";

const UPDATE_TOKENS_BATCH_SIZE = 100;

@Injectable()
export class TokenOffChainDataSaverService extends Worker {
  private readonly updateTokenOffChainDataInterval: number;
  private readonly logger: Logger;

  public constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly tokenOffChainDataProvider: TokenOffChainDataProvider,
    configService: ConfigService
  ) {
    super();
    this.updateTokenOffChainDataInterval = configService.get<number>("tokens.updateTokenOffChainDataInterval");
    this.logger = new Logger(TokenOffChainDataSaverService.name);
  }

  protected async runProcess(): Promise<void> {
    let nextUpdateTimeout = this.updateTokenOffChainDataInterval;
    try {
      const lastUpdatedAt = await this.tokenRepository.getOffChainDataLastUpdatedAt();
      const now = new Date().getTime();
      const timeSinceLastUpdate = lastUpdatedAt ? now - lastUpdatedAt.getTime() : this.updateTokenOffChainDataInterval;
      nextUpdateTimeout =
        timeSinceLastUpdate >= this.updateTokenOffChainDataInterval
          ? 0
          : this.updateTokenOffChainDataInterval - timeSinceLastUpdate;

      if (!nextUpdateTimeout) {
        const bridgedTokens = await this.tokenRepository.getBridgedTokens();
        const tokensToUpdate = await this.tokenOffChainDataProvider.getTokensOffChainData({
          bridgedTokensToInclude: bridgedTokens.map((t) => t.l1Address),
        });
        const updatedAt = new Date();

        let updateTokensTasks = [];
        for (let i = 0; i < tokensToUpdate.length; i++) {
          updateTokensTasks.push(
            this.tokenRepository.updateTokenOffChainData({
              l1Address: tokensToUpdate[i].l1Address,
              l2Address: tokensToUpdate[i].l2Address,
              liquidity: tokensToUpdate[i].liquidity,
              usdPrice: tokensToUpdate[i].usdPrice,
              updatedAt,
              iconURL: tokensToUpdate[i].iconURL,
            })
          );
          if (updateTokensTasks.length === UPDATE_TOKENS_BATCH_SIZE || i === tokensToUpdate.length - 1) {
            await Promise.all(updateTokensTasks);
            updateTokensTasks = [];
          }
        }

        this.logger.log("Updated tokens offchain data", {
          totalTokensUpdated: tokensToUpdate.length,
        });

        nextUpdateTimeout = this.updateTokenOffChainDataInterval;
      }
    } catch (err) {
      this.logger.error({
        message: "Failed to update tokens offchain data",
        originalError: err,
      });
      nextUpdateTimeout = this.updateTokenOffChainDataInterval;
    }

    await waitFor(() => !this.currentProcessPromise, nextUpdateTimeout);
    if (!this.currentProcessPromise) {
      return;
    }

    return this.runProcess();
  }
}
