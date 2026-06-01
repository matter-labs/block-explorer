import { type Log, type Block } from "ethers";
import { AbiCoder } from "ethers";
import { BlockchainService } from "../../../blockchain/blockchain.service";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { isBaseToken } from "../../../utils/token";
import { BASE_TOKEN_ADDRESS, CONTRACT_INTERFACES, ETH_L1_ADDRESS, L2_ASSET_ROUTER_ADDRESS } from "../../../constants";

export const assetRouterWithdrawalInitiatedHandler: ExtractTransferHandler = {
  // Only the trusted L2 Asset Router (a system contract at the same fixed address on Era and every
  // ZK chain) may emit authoritative bridge withdrawal events. Without this check any contract could emit
  // an ABI-shaped WithdrawalInitiatedAssetRouter log and have it indexed as a real bridge withdrawal.
  matches: (log: Log): boolean => log.address.toLowerCase() === L2_ASSET_ROUTER_ADDRESS,
  extract: async (log: Log, blockchainService: BlockchainService, block: Block): Promise<Transfer> => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.L2_ASSET_ROUTER, log);
    if (!parsedLog) {
      return null;
    }
    const assetId = parsedLog.args.assetId;
    let tokenAddress = (await blockchainService.getTokenAddressByAssetId(assetId)).toLowerCase();
    if (tokenAddress === ETH_L1_ADDRESS) {
      tokenAddress = BASE_TOKEN_ADDRESS;
    }

    const assetData = parsedLog.args.assetData;
    const [amount, receiver] = AbiCoder.defaultAbiCoder().decode(["uint256", "address", "address"], assetData);

    return {
      from: parsedLog.args.l2Sender.toLowerCase(),
      to: receiver.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: amount,
      tokenAddress,
      type: TransferType.Withdrawal,
      tokenType: isBaseToken(tokenAddress) ? TokenType.BaseToken : TokenType.ERC20,
      isFeeOrRefund: false,
      logIndex: log.index,
      transactionIndex: log.transactionIndex,
      timestamp: unixTimeToDate(block.timestamp),
    };
  },
};
