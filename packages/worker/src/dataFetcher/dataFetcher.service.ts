import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import { BlockData } from "./types";

@Injectable()
export class DataFetcherService {
  private readonly logger: Logger;
  private readonly apiUrl: string;
  private readonly requestTimeout: number;

  constructor(configService: ConfigService, private readonly httpService: HttpService) {
    this.logger = new Logger(DataFetcherService.name);
    this.apiUrl = configService.get<string>("dataFetcher.url");
    this.requestTimeout = configService.get<number>("dataFetcher.requestTimeout");
  }

  public async getBlockData(blockNumber: number): Promise<BlockData> {
    const blocksData = await this.getBlocksData(blockNumber, blockNumber);
    return blocksData[0];
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
