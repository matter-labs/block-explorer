import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "../../common/worker";
import waitFor from "../../utils/waitFor";
import { TokenRepository } from "../../repositories/token.repository";
import { TokenInfoProvider } from "./tokenInfoProvider.abstract";

const UPDATE_TOKENS_BATCH_SIZE = 100;

@Injectable()
export class TokenInfoWorkerService extends Worker {
  private readonly updateTokenInfoInterval: number;
  private readonly minTokensLiquidityFilter: number;
  private readonly logger: Logger;

  public constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly tokenInfoProvider: TokenInfoProvider,
    configService: ConfigService
  ) {
    super();
    this.updateTokenInfoInterval = configService.get<number>("tokens.updateTokenInfoInterval");
    this.minTokensLiquidityFilter = configService.get<number>("tokens.minTokensLiquidityFilter");
    this.logger = new Logger(TokenInfoWorkerService.name);
  }

  protected async runProcess(): Promise<void> {
    let nextUpdateTimeout = this.updateTokenInfoInterval;
    try {
      const lastUpdatedAt = await this.tokenRepository.getOffChainDataLastUpdatedAt();
      const now = new Date().getTime();
      const timeSinceLastUpdate = lastUpdatedAt ? now - lastUpdatedAt.getTime() : this.updateTokenInfoInterval;
      nextUpdateTimeout =
        timeSinceLastUpdate >= this.updateTokenInfoInterval ? 0 : this.updateTokenInfoInterval - timeSinceLastUpdate;

      if (!nextUpdateTimeout) {
        const tokensInfo = await this.tokenInfoProvider.getTokensInfo(this.minTokensLiquidityFilter);
        const bridgedTokens = await this.tokenRepository.getBridgedTokens();
        const tokensToUpdate = tokensInfo.filter((token) => bridgedTokens.find((t) => t.l1Address === token.l1Address));
        const updatedAt = new Date();

        let updateTokensTasks = [];
        for (let i = 0; i < tokensToUpdate.length; i++) {
          updateTokensTasks.push(
            this.tokenRepository.updateTokenOffChainData({
              l1Address: tokensToUpdate[i].l1Address,
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

        nextUpdateTimeout = this.updateTokenInfoInterval;
      }
    } catch (err) {
      this.logger.error({
        message: "Failed to update tokens offchain data",
        originalError: err,
      });
      nextUpdateTimeout = this.updateTokenInfoInterval;
    }

    await waitFor(() => !this.currentProcessPromise, nextUpdateTimeout);
    if (!this.currentProcessPromise) {
      return;
    }

    return this.runProcess();
  }
}
