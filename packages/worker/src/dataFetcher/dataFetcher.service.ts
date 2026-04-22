import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import { BlockData } from "./types";
import { setTimeout } from "node:timers/promises";
import { GET_BLOCK_INFO_DURATION_METRIC_NAME, ProcessingActionMetricLabel } from "../metrics";

const DATA_FETCHER_RETRY_TIMEOUT = 1000;

@Injectable()
export class DataFetcherService {
  private readonly logger: Logger;
  private readonly apiUrl: string;
  private readonly requestTimeout: number;

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectMetric(GET_BLOCK_INFO_DURATION_METRIC_NAME)
    private readonly getBlockInfoDurationMetric: Histogram<ProcessingActionMetricLabel>
  ) {
    this.logger = new Logger(DataFetcherService.name);
    this.apiUrl = configService.get<string>("dataFetcher.url");
    this.requestTimeout = configService.get<number>("dataFetcher.requestTimeout");
  }

  public async getBlockData(blockNumber: number): Promise<BlockData> {
    const stopDurationMetric = this.getBlockInfoDurationMetric.startTimer();
    try {
      const blocksData = await this.getBlocksDataRetryable(blockNumber, blockNumber);
      return blocksData[0];
    } finally {
      stopDurationMetric();
    }
  }

  private async getBlocksDataRetryable(from: number, to: number): Promise<BlockData[]> {
    try {
      return await this.getBlocksData(from, to);
    } catch {
      this.logger.debug({
        message: `Retrying to fetch data for blocks: [${from}, ${to}]`,
      });
      await setTimeout(DATA_FETCHER_RETRY_TIMEOUT);
      return this.getBlocksDataRetryable(from, to);
    }
  }

  private async getBlocksData(from: number, to: number): Promise<BlockData[]> {
    const queryString = new URLSearchParams({
      from: from.toString(),
      to: to.toString(),
    }).toString();

    const { data } = await firstValueFrom<{ data: BlockData[] }>(
      this.httpService.get(`${this.apiUrl}/blocks?${queryString}`, { timeout: this.requestTimeout }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error({
            message: `Failed to fetch data for blocks: [${from}, ${to}]. ${error.message}`,
            code: error.code,
            status: error.response?.status,
            response: error.response?.data,
          });
          throw error;
        })
      )
    );
    return data;
  }
}
