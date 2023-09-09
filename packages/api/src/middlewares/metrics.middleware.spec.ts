import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Request, Response } from "express";
import { MetricsMiddleware } from "./metrics.middleware";

describe("MetricsMiddleware", () => {
  let startRequestDurationMetricMock: jest.Mock;
  let stopRequestDurationMetricMock: jest.Mock;
  let metricsMiddleware: MetricsMiddleware;
  let request: Request;
  let response: Response;
  let nextMock: jest.Mock;
  const method = "GET";
  const path = "/token/:address";
  const statusCode = 200;

  beforeEach(async () => {
    request = mock<Request>({
      method,
      route: {
        path,
      },
    });

    response = mock<Response>({
      statusCode,
      once: jest.fn().mockImplementation((_, callback) => {
        callback();
      }),
    });

    nextMock = jest.fn();

    stopRequestDurationMetricMock = jest.fn();
    startRequestDurationMetricMock = jest.fn().mockReturnValue(stopRequestDurationMetricMock);

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsMiddleware,
        {
          provide: "PROM_METRIC_REQUEST_DURATION_SECONDS",
          useValue: {
            startTimer: startRequestDurationMetricMock,
          },
        },
      ],
    }).compile();

    metricsMiddleware = app.get<MetricsMiddleware>(MetricsMiddleware);
  });

  describe("use", () => {
    it("starts the duration metric", () => {
      metricsMiddleware.use(request, response, nextMock);
      expect(startRequestDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("subscribes to finish event", () => {
      metricsMiddleware.use(request, response, nextMock);
      expect(response.once).toHaveBeenCalledTimes(1);
      expect(response.once).toHaveBeenCalledWith("finish", expect.any(Function));
    });

    it("calls the next function", () => {
      metricsMiddleware.use(request, response, nextMock);
      expect(nextMock).toHaveBeenCalledTimes(1);
    });

    it("stops the duration metric", async () => {
      metricsMiddleware.use(request, response, nextMock);
      expect(stopRequestDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("sets duration metric labels", async () => {
      metricsMiddleware.use(request, response, nextMock);
      expect(stopRequestDurationMetricMock).toHaveBeenCalledWith({
        method,
        path,
        statusCode,
      });
    });

    describe("when request was not handled by any route", () => {
      beforeEach(() => {
        request.route = null;
      });

      it("stops the duration metric", async () => {
        metricsMiddleware.use(request, response, nextMock);
        expect(stopRequestDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      it("sets duration metric labels with undefined path", async () => {
        metricsMiddleware.use(request, response, nextMock);
        expect(stopRequestDurationMetricMock).toHaveBeenCalledWith({
          method,
          path: undefined,
          statusCode,
        });
      });
    });
  });
});
