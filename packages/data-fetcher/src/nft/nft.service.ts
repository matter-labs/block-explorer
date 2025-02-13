import { Injectable, Logger } from "@nestjs/common";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { Contract } from "ethers";
import * as erc721Abi from "../abis/erc721.json";
import { JsonRpcProviderBase } from "../rpcProvider/jsonRpcProviderBase";

export type NftItem = {
  owner: string;
  tokenAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  metadataUrl?: string;
};

type NftKey = { tokenAddress: string; tokenId: string };
type NftValue = { timestamp: Date; owner: string };

@Injectable()
export class NftService {
  private readonly logger: Logger;
  public allNfts = new Map<number, Map<string, NftValue>>();
  constructor(private readonly provider: JsonRpcProviderBase) {
    this.logger = new Logger(NftService.name);
    this.allNfts = new Map<number, Map<string, NftValue>>();
  }

  public trackNftItems(transfers: Transfer[]): void {
    if (!transfers || !transfers.length) {
      return;
    }
    const erc721Transfers = transfers.filter((transfer) => transfer.tokenType === "ERC721");

    if (!erc721Transfers.length) {
      return;
    }

    const changedNfts = this.allNfts.get(erc721Transfers[0].blockNumber) || new Map<string, NftValue>();

    for (const transfer of erc721Transfers) {
      const key = this.generateKey({
        tokenAddress: transfer.tokenAddress,
        tokenId: transfer.fields.tokenId.toString(),
      });
      if (!changedNfts.has(key) || transfer.timestamp > changedNfts.get(key).timestamp) {
        changedNfts.set(key, { timestamp: transfer.timestamp, owner: transfer.to });
      }
    }

    this.allNfts.set(erc721Transfers[0].blockNumber, changedNfts);
  }

  public clearTrackedState(blockNumber: number): void {
    this.allNfts.delete(blockNumber);
  }

  public async getNftItems(blockNumber: number): Promise<NftItem[]> {
    const changedNfts = this.allNfts.get(blockNumber);
    if (!changedNfts) {
      return [];
    }
    const nftItems: NftItem[] = [];
    await Promise.all(
      Array.from(changedNfts.entries()).map(async ([stringKey, value]) => {
        const key = this.revertKey(stringKey);
        const tokenURI = await this.getTokenURI(key.tokenAddress, key.tokenId);
        const metadata = await this.fetchMetadata(tokenURI);

        nftItems.push({
          tokenAddress: key.tokenAddress,
          owner: value.owner,
          tokenId: key.tokenId,
          name: metadata?.name,
          description: metadata?.description,
          imageUrl: metadata?.image?.includes("ipfs://")
            ? metadata?.image?.replace("ipfs://", "https://ipfs.io/ipfs/")
            : metadata?.image,
          metadataUrl: tokenURI,
        });
      })
    );
    return nftItems;
  }

  private async getTokenURI(tokenAddress: string, tokenId: string): Promise<string> {
    try {
      const contract = new Contract(tokenAddress, erc721Abi, this.provider);
      return await contract.tokenURI(tokenId);
    } catch (error) {
      this.logger.log(
        "Could not fetch token URI for NFT with token address: " + tokenAddress + " and token ID: " + tokenId
      );
      return null;
    }
  }

  private async fetchMetadata(uri: string): Promise<any> {
    if (!uri) {
      return null;
    }
    const formattedUri = uri.includes("ipfs://") ? uri.replace("ipfs://", "https://ipfs.io/ipfs/") : uri;
    try {
      const response = await fetch(formattedUri);
      return await response.json();
    } catch (error) {
      this.logger.log("Could not fetch metadata for NFT with URI: " + uri);
      return null;
    }
  }

  private generateKey(key: NftKey): string {
    return `${key.tokenAddress}-${key.tokenId}`;
  }

  private revertKey(key: string): NftKey {
    const [tokenAddress, tokenId] = key.split("-");
    return { tokenAddress, tokenId };
  }
}
