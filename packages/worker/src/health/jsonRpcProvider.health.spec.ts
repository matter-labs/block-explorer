import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { HealthCheckError } from "@nestjs/terminus";
import { JsonRpcProviderBase } from "../rpcProvider";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";

describe("JsonRpcHealthIndicator", () => {
  const healthIndicatorKey = "rpcProvider";
  let jsonRpcProviderMock: JsonRpcProviderBase;
  let jsonRpcHealthIndicator: JsonRpcHealthIndicator;

  beforeEach(async () => {
    jsonRpcProviderMock = mock<JsonRpcProviderBase>();

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        JsonRpcHealthIndicator,
        {
          provide: JsonRpcProviderBase,
          useValue: jsonRpcProviderMock,
        },
      ],
    }).compile();

    jsonRpcHealthIndicator = app.get<JsonRpcHealthIndicator>(JsonRpcHealthIndicator);
  });

  describe("isHealthy", () => {
    describe("when rpcProvider is open", () => {
      beforeEach(() => {
        jest.spyOn(jsonRpcProviderMock, "getState").mockReturnValueOnce("open");
      });

      it("returns OK health indicator result", async () => {
        const result = await jsonRpcHealthIndicator.isHealthy(healthIndicatorKey);
        expect(result).toEqual({ [healthIndicatorKey]: { rpcProviderState: "open", status: "up" } });
      });
    });

    describe("when rpcProvider is closed", () => {
      beforeEach(() => {
        jest.spyOn(jsonRpcProviderMock, "getState").mockReturnValueOnce("closed");
      });

      it("throws HealthCheckError error", async () => {
        expect.assertions(2);
        try {
          await jsonRpcHealthIndicator.isHealthy(healthIndicatorKey);
        } catch (error) {
          expect(error).toBeInstanceOf(HealthCheckError);
          expect(error.message).toBe("JSON RPC provider is not in open state");
        }
      });
    });
  });
});
