import { NftItemRepository } from "../repositories/nftItem.repository";
import { Injectable, Logger } from "@nestjs/common";

interface NftItem {
  owner: string;
  tokenAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  metadataUrl?: string;
}

@Injectable()
export class NftItemService {
  private readonly logger: Logger;
  constructor(private readonly nftItemRepository: NftItemRepository) {
    this.logger = new Logger(NftItemService.name);
  }

  public async saveNftItem(nftItem: NftItem): Promise<void> {
    this.logger.debug(`Saving NFT item ${nftItem.tokenId} for token ${nftItem.tokenAddress}`);
    await this.nftItemRepository.upsert(nftItem, true, ["tokenId", "tokenAddress"]);
  }

  public async saveNftItems(nftItems: NftItem[]): Promise<void> {
    nftItems.forEach(async (nftItem) => {
      await this.saveNftItem(nftItem);
    });
  }
}
