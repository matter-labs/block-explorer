import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { RetryDelayProvider } from "./retryDelay.provider";

describe("RetryDelayProvider", () => {
  let configService: ConfigService;

  beforeEach(async () => {
    configService = mock<ConfigService>({
      get: jest.fn().mockReturnValue(2000),
    });
  });

  describe("getRetryDelay", () => {
    it("returns configured delay for the first delay request", () => {
      const retryDelayProvider = new RetryDelayProvider(configService);
      const delay = retryDelayProvider.getRetryDelay();
      expect(delay).toBe(2000);
    });

    it("returns exponential retry delays for each retry", () => {
      const retryDelayProvider = new RetryDelayProvider(configService);
      const delays = [];
      for (let i = 0; i < 5; i++) {
        delays.push(retryDelayProvider.getRetryDelay());
      }
      expect(delays).toEqual([2000, 4000, 8000, 16000, 32000]);
    });

    it("max retry delay increases to 10 mins", () => {
      (configService.get as jest.Mock).mockReturnValueOnce(1000 * 60 * 5);
      const retryDelayProvider = new RetryDelayProvider(configService);

      const delays = [];
      for (let i = 0; i < 4; i++) {
        delays.push(retryDelayProvider.getRetryDelay());
      }

      expect(delays).toEqual([1000 * 60 * 5, 1000 * 60 * 10, 1000 * 60 * 10, 1000 * 60 * 10]);
    });
  });

  describe("resetRetryDelay", () => {
    it("resets retry delay to the default value", () => {
      const retryDelayProvider = new RetryDelayProvider(configService);
      retryDelayProvider.getRetryDelay();
      retryDelayProvider.resetRetryDelay();
      let retry = retryDelayProvider.getRetryDelay();
      expect(retry).toBe(2000);

      retryDelayProvider.getRetryDelay();
      retryDelayProvider.getRetryDelay();
      retryDelayProvider.resetRetryDelay();
      retry = retryDelayProvider.getRetryDelay();

      expect(retry).toBe(2000);
    });
  });
});
