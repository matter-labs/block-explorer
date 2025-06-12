import { PrividiumAddressController } from "./prividium-address.controller";
import { AddressService } from "./address.service";
import { mock, MockProxy } from "jest-mock-extended";
import { LogService } from "../log/log.service";
import { TransferService } from "../transfer/transfer.service";
import { Request } from "express";
import { calculateSiwe } from "../../test/utils/siwe-message-tools";
import { SiweMessage } from "siwe";
import { Address } from "./address.entity";
import { pad } from "../common/utils";
import { BlockService } from "../block/block.service";
import { getAddress } from "ethers";
import { TransferType } from "../transfer/transfer.entity";

describe("PrividiumAddressController", () => {
  let addressService: MockProxy<AddressService>;
  let logService: MockProxy<LogService>;
  let transferService: MockProxy<TransferService>;
  let blockService: MockProxy<BlockService>;

  let controller: PrividiumAddressController;

  let req: MockProxy<Request>;

  const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const otherAddress = "0x" + "a".repeat(40);
  const userSecKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  let userSiwe: SiweMessage;
  const contractAddress = "0x" + "b".repeat(40);
  const contractAddressEntity: Address = {
    address: contractAddress,
    createdAt: new Date(),
    updatedAt: new Date(),
    bytecode: "0x010203",
    creatorAddress: "0x02",
    createdInBlockNumber: 100,
    creatorTxHash: "0x03",
    isEvmLike: true,
  };
  const eoaAddressEntity = (addr: string): Address => ({
    address: addr,
    createdAt: new Date(),
    updatedAt: new Date(),
    bytecode: "0x",
    creatorAddress: null,
    createdInBlockNumber: null,
    creatorTxHash: null,
    isEvmLike: false,
  });

  beforeEach(async () => {
    addressService = mock<AddressService>();
    logService = mock<LogService>();
    transferService = mock<TransferService>();
    blockService = mock<BlockService>();

    controller = new PrividiumAddressController(addressService, logService, transferService, blockService);

    req = mock<Request>();

    const { siwe } = await calculateSiwe({
      nonce: "8r2cXq20yD3l5bomR",
      privateKey: userSecKey,
      chainId: 333,
    });
    userSiwe = siwe;
  });

  describe("getPrividiumAddress", () => {
    it("when address is contract and user is owner searches for balances", async () => {
      req.session.siwe = userSiwe;
      addressService.findOne.mockReturnValue(Promise.resolve(contractAddressEntity));
      logService.findContractOwnerTopic.mockReturnValue(Promise.resolve(pad(userAddress)));
      await controller.getPrividiumAddress(contractAddress, req);
      expect(addressService.findFullAddress).toHaveBeenCalledWith(contractAddress, true);
    });

    it("when address is contract and contract has not owner does not query for balances", async () => {
      req.session.siwe = userSiwe;
      addressService.findOne.mockReturnValue(Promise.resolve(contractAddressEntity));
      logService.findContractOwnerTopic.mockReturnValue(Promise.resolve(null));
      await controller.getPrividiumAddress(contractAddress, req);
      expect(addressService.findFullAddress).toHaveBeenCalledWith(contractAddress, false);
    });

    it("when address is contract and user is not the owner it does not query for balances", async () => {
      req.session.siwe = userSiwe;
      const owner = "0x" + "c".repeat(40);
      addressService.findOne.mockReturnValue(Promise.resolve(contractAddressEntity));
      logService.findContractOwnerTopic.mockReturnValue(Promise.resolve(owner));
      await controller.getPrividiumAddress(contractAddress, req);
      expect(addressService.findFullAddress).toHaveBeenCalledWith(contractAddress, false);
    });

    it("when address is EoA and is not the current user it returns default empty address response", async () => {
      req.session.siwe = userSiwe;
      addressService.findOne.mockReturnValue(Promise.resolve(eoaAddressEntity(otherAddress)));
      const latestBlock = 100;
      blockService.getLastBlockNumber.mockReturnValue(Promise.resolve(latestBlock));
      const res = await controller.getPrividiumAddress(otherAddress, req);
      expect(res).toEqual({
        type: "account",
        address: getAddress(otherAddress),
        blockNumber: latestBlock,
        balances: {},
        sealedNonce: 0,
        verifiedNonce: 0,
      });
    });

    it("when requested address is user address it requests balances", async () => {
      req.session.siwe = userSiwe;
      addressService.findOne.mockReturnValue(Promise.resolve(eoaAddressEntity(userAddress)));
      const latestBlock = 100;
      blockService.getLastBlockNumber.mockReturnValue(Promise.resolve(latestBlock));
      await controller.getPrividiumAddress(userAddress, req);
      expect(addressService.findFullAddress).toHaveBeenCalledWith(userAddress, true);
    });
  });

  describe("getPrividiumAddressLogs", () => {
    const pagingOptions = { limit: 10, page: 1, maxLimit: 100 };

    it("when user is owner of contract does not include topic filter", async () => {
      req.session.siwe = userSiwe;
      logService.findContractOwnerTopic.mockReturnValue(Promise.resolve(pad(userAddress)));
      await controller.getPrividiumAddressLogs(contractAddress, pagingOptions, req);
      expect(logService.findAll).toHaveBeenCalledWith(
        { address: contractAddress },
        expect.objectContaining(pagingOptions)
      );
    });

    it("when user is not the owner of contract it includes topic filter", async () => {
      req.session.siwe = userSiwe;
      logService.findContractOwnerTopic.mockReturnValue(Promise.resolve(pad(otherAddress)));
      await controller.getPrividiumAddressLogs(contractAddress, pagingOptions, req);
      expect(logService.findAll).toHaveBeenCalledWith(
        {
          address: contractAddress,
          someTopicMatch: pad(userAddress),
        },
        expect.objectContaining(pagingOptions)
      );
    });

    it("when contract has no owner it includes topic filter", async () => {
      req.session.siwe = userSiwe;
      logService.findContractOwnerTopic.mockReturnValue(Promise.resolve(null));
      await controller.getPrividiumAddressLogs(contractAddress, pagingOptions, req);
      expect(logService.findAll).toHaveBeenCalledWith(
        {
          address: contractAddress,
          someTopicMatch: pad(userAddress),
        },
        expect.objectContaining(pagingOptions)
      );
    });
  });

  describe("getAddressTransfers", () => {
    const pagingOptions = { limit: 10, page: 1, maxLimit: 100 };
    it("when current user is not the queried user always returns empty list", async () => {
      req.session.siwe = userSiwe;

      const res = await controller.getAddressTransfers(
        otherAddress,
        {
          type: TransferType.Transfer,
        },
        { fromDate: new Date().toISOString(), toDate: new Date().toISOString() },
        pagingOptions,
        req
      );

      expect(res).toEqual({
        items: [],
        meta: {
          currentPage: 1,
          itemCount: 0,
          itemsPerPage: 10,
        },
      });
      expect(transferService.findAll).not.toHaveBeenCalled();
    });

    it("when address belongs to user it searches for transfers", async () => {
      req.session.siwe = userSiwe;

      await controller.getAddressTransfers(
        userAddress,
        {
          type: TransferType.Transfer,
        },
        { fromDate: new Date().toISOString(), toDate: new Date().toISOString() },
        pagingOptions,
        req
      );

      expect(transferService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ address: userAddress }),
        expect.objectContaining(pagingOptions)
      );
    });

    it("when address belongs to user it searches for transfers", async () => {
      req.session.siwe = userSiwe;

      await controller.getAddressTransfers(
        userAddress,
        {},
        { fromDate: new Date().toISOString(), toDate: new Date().toISOString() },
        pagingOptions,
        req
      );

      expect(transferService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ address: userAddress, isFeeOrRefund: false }),
        expect.objectContaining(pagingOptions)
      );
    });
  });
});
