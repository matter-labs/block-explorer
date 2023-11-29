import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import waitFor from "../../utils/waitFor";
import { TokenOffChainDataSaverService } from "./tokenOffChainDataSaver.service";
import { TokenRepository } from "../../repositories/token.repository";
import { TokenOffChainDataProvider } from "./tokenOffChainDataProvider.abstract";
import { Token } from "../../entities";

jest.useFakeTimers().setSystemTime(new Date("2023-01-01T02:00:00.000Z"));

jest.mock("@nestjs/common", () => {
  return {
    ...jest.requireActual("@nestjs/common"),
    Logger: function () {
      return { debug: jest.fn(), log: jest.fn(), error: jest.fn() };
    },
  };
});
jest.mock("../../utils/waitFor");

describe("TokenOffChainDataSaverService", () => {
  const OFFCHAIN_DATA_UPDATE_INTERVAL = 86_400_000;
  const tokenOffChainDataMock = {
    l1Address: "l1Address",
    l2Address: "l2Address",
    liquidity: 100000,
    usdPrice: 12.6789,
    iconURL: "http://icon.com",
  };
  let tokenRepositoryMock: TokenRepository;
  let tokenOffChainDataProviderMock: TokenOffChainDataProvider;
  let tokenOffChainDataSaverService: TokenOffChainDataSaverService;

  beforeEach(() => {
    (waitFor as jest.Mock).mockResolvedValue(null);
    tokenRepositoryMock = mock<TokenRepository>({
      getOffChainDataLastUpdatedAt: jest.fn().mockResolvedValue(null),
      getBridgedTokens: jest.fn().mockResolvedValue([]),
      updateTokenOffChainData: jest.fn().mockResolvedValue(null),
    });
    tokenOffChainDataProviderMock = mock<TokenOffChainDataProvider>({
      getTokensOffChainData: jest.fn().mockResolvedValue([tokenOffChainDataMock]),
    });

    tokenOffChainDataSaverService = new TokenOffChainDataSaverService(
      tokenRepositoryMock,
      tokenOffChainDataProviderMock,
      mock<ConfigService>({
        get: jest.fn().mockReturnValue(OFFCHAIN_DATA_UPDATE_INTERVAL),
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("start", () => {
    it("waits for specified update offchain data interval when fails to get last offchain data updated date", async () => {
      jest.spyOn(tokenRepositoryMock, "getOffChainDataLastUpdatedAt").mockRejectedValueOnce(new Error("error"));

      tokenOffChainDataSaverService.start();
      await tokenOffChainDataSaverService.stop();

      const [conditionPredicate, waitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(tokenRepositoryMock.getOffChainDataLastUpdatedAt).toBeCalledTimes(1);
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(waitTime).toBe(OFFCHAIN_DATA_UPDATE_INTERVAL);
    });

    it("does not update offchain data when it was updated recently and waits for remaining time", async () => {
      const lastUpdatedAt = new Date("2023-01-01T01:00:00.000Z");
      const remainingTimeToWaitForUpdate =
        OFFCHAIN_DATA_UPDATE_INTERVAL - (new Date().getTime() - lastUpdatedAt.getTime());
      jest.spyOn(tokenRepositoryMock, "getOffChainDataLastUpdatedAt").mockResolvedValueOnce(lastUpdatedAt);

      tokenOffChainDataSaverService.start();
      await tokenOffChainDataSaverService.stop();

      const [conditionPredicate, waitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(tokenRepositoryMock.getOffChainDataLastUpdatedAt).toBeCalledTimes(1);
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(waitTime).toBe(remainingTimeToWaitForUpdate);
      expect(tokenRepositoryMock.getBridgedTokens).not.toBeCalled();
      expect(tokenOffChainDataProviderMock.getTokensOffChainData).not.toBeCalled();
    });

    it("updates offchain data when data is too old", async () => {
      const lastUpdatedAt = new Date("2022-01-01T01:00:00.000Z");
      jest.spyOn(tokenRepositoryMock, "getOffChainDataLastUpdatedAt").mockResolvedValueOnce(lastUpdatedAt);
      jest.spyOn(tokenRepositoryMock, "getBridgedTokens").mockResolvedValueOnce([{ l1Address: "l1Address" } as Token]);

      tokenOffChainDataSaverService.start();
      await tokenOffChainDataSaverService.stop();

      expect(tokenOffChainDataProviderMock.getTokensOffChainData).toBeCalledWith({
        bridgedTokensToInclude: ["l1Address"],
      });
      expect(tokenRepositoryMock.updateTokenOffChainData).toHaveBeenCalledTimes(1);
      expect(tokenRepositoryMock.updateTokenOffChainData).toHaveBeenCalledWith({
        l1Address: "l1Address",
        l2Address: "l2Address",
        liquidity: 100000,
        usdPrice: 12.6789,
        updatedAt: new Date(),
        iconURL: "http://icon.com",
      });
    });

    it("updates offchain data when data was never updated", async () => {
      jest.spyOn(tokenRepositoryMock, "getBridgedTokens").mockResolvedValueOnce([{ l1Address: "l1Address" } as Token]);

      tokenOffChainDataSaverService.start();
      await tokenOffChainDataSaverService.stop();

      expect(tokenOffChainDataProviderMock.getTokensOffChainData).toBeCalledWith({
        bridgedTokensToInclude: ["l1Address"],
      });
      expect(tokenRepositoryMock.updateTokenOffChainData).toHaveBeenCalledTimes(1);
      expect(tokenRepositoryMock.updateTokenOffChainData).toHaveBeenCalledWith({
        l1Address: "l1Address",
        l2Address: "l2Address",
        liquidity: 100000,
        usdPrice: 12.6789,
        updatedAt: new Date(),
        iconURL: "http://icon.com",
      });
    });

    it("waits for specified timeout or worker stoppage after offchain data update", async () => {
      jest.spyOn(tokenRepositoryMock, "getBridgedTokens").mockResolvedValueOnce([{ l1Address: "l1Address" } as Token]);

      tokenOffChainDataSaverService.start();
      await tokenOffChainDataSaverService.stop();

      const [conditionPredicate, waitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(waitTime).toBe(OFFCHAIN_DATA_UPDATE_INTERVAL);
    });

    it("starts the process only once when called multiple times", async () => {
      tokenOffChainDataSaverService.start();
      tokenOffChainDataSaverService.start();
      await tokenOffChainDataSaverService.stop();

      expect(tokenRepositoryMock.getOffChainDataLastUpdatedAt).toBeCalledTimes(1);
    });

    it("runs update process iteratively until stopped", async () => {
      let secondIterationResolve: (value: unknown) => void;
      const secondIterationPromise = new Promise((resolve) => (secondIterationResolve = resolve));

      jest
        .spyOn(tokenRepositoryMock, "getOffChainDataLastUpdatedAt")
        .mockResolvedValueOnce(null)
        .mockImplementationOnce(() => {
          secondIterationResolve(null);
          return Promise.resolve(null);
        })
        .mockResolvedValueOnce(null);

      tokenOffChainDataSaverService.start();

      await secondIterationPromise;
      await tokenOffChainDataSaverService.stop();

      expect(tokenRepositoryMock.getOffChainDataLastUpdatedAt).toBeCalledTimes(2);
    });
  });

  describe("stop", () => {
    it("stops offchain data saver process", async () => {
      tokenOffChainDataSaverService.start();
      await tokenOffChainDataSaverService.stop();

      expect(tokenRepositoryMock.getOffChainDataLastUpdatedAt).toBeCalledTimes(1);
    });
  });
});
