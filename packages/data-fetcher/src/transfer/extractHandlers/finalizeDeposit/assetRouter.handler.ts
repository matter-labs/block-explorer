import { utils, types } from "zksync-ethers";
import { AbiCoder } from "ethers";
import { BlockchainService } from "../../../blockchain/blockchain.service";
import { Transfer } from "../../interfaces/transfer.interface";
import { ExtractTransferHandler } from "../../interfaces/extractTransferHandler.interface";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { unixTimeToDate } from "../../../utils/date";
import parseLog from "../../../utils/parseLog";
import { BASE_TOKEN_ADDRESS, CONTRACT_INTERFACES } from "../../../constants";
import { isBaseToken } from "../../../utils/token";

export const assetRouterFinalizeDepositHandler: ExtractTransferHandler = {
  matches: (): boolean => true,
  extract: async (
    log: types.Log,
    blockchainService: BlockchainService,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ): Promise<Transfer> => {
    const parsedLog = parseLog(CONTRACT_INTERFACES.L2_ASSET_ROUTER, log);
    const assetId = parsedLog.args.assetId;
    let tokenAddress = (await blockchainService.getTokenAddressByAssetId(assetId)).toLowerCase();
    if (tokenAddress === utils.ETH_ADDRESS.toLowerCase()) {
      tokenAddress = BASE_TOKEN_ADDRESS;
    }

    const assetData = parsedLog.args.assetData;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [originalCaller, remoteReceiver, _, amount] = AbiCoder.defaultAbiCoder().decode(
      ["address", "address", "address", "uint256", "bytes"],
      assetData
    );

    return {
      from: originalCaller.toLowerCase(),
      to: remoteReceiver.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount,
      tokenAddress,
      type: TransferType.Deposit,
      tokenType: isBaseToken(tokenAddress) ? TokenType.BaseToken : TokenType.ERC20,
      isFeeOrRefund: false,
      logIndex: log.index,
      transactionIndex: log.transactionIndex,
      timestamp: transactionDetails?.receivedAt || unixTimeToDate(blockDetails.timestamp),
    };
  },
};
