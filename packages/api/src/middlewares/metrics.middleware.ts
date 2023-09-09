import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { REQUEST_DURATION_METRIC_NAME, RequestDurationMetricLabels } from "../metrics";

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric(REQUEST_DURATION_METRIC_NAME)
    private readonly requestDurationMetric: Histogram<RequestDurationMetricLabels>
  ) {}

  public use(request: Request, response: Response, next: NextFunction) {
    const stopDurationMeasuring = this.requestDurationMetric.startTimer();

    response.once("finish", () => {
      stopDurationMeasuring({
        method: request.method,
        path: request.route?.path,
        statusCode: response.statusCode,
      });
    });

    next();
  }
}
