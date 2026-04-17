import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IndexerState } from "./indexerState.entity";

@Injectable()
export class IndexerStateService {
  private readonly cacheTtlMs: number;
  private cachedValue: number | null = null;
  private cachedAt = 0;
  private pending: Promise<number> | null = null;

  constructor(
    @InjectRepository(IndexerState)
    private readonly repository: Repository<IndexerState>,
    configService: ConfigService
  ) {
    this.cacheTtlMs = configService.get<number>("indexerStateCacheTtlMs");
  }

  public async getLastReadyBlockNumber(): Promise<number> {
    if (this.cachedValue !== null && Date.now() - this.cachedAt < this.cacheTtlMs) {
      return this.cachedValue;
    }
    if (this.pending) {
      return this.pending;
    }
    this.pending = this.fetchAndCache();
    try {
      return await this.pending;
    } finally {
      this.pending = null;
    }
  }

  private async fetchAndCache(): Promise<number> {
    const state = await this.repository.findOne({ where: {} });
    this.cachedValue = state?.lastReadyBlockNumber ?? 0;
    this.cachedAt = Date.now();
    return this.cachedValue;
  }
}
