import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Request } from "express";
import { ApiContractAction, ApiModule } from "./types";
import { SortingOrder } from "../common/types";
import { ApiController } from "./api.controller";

describe("ApiController", () => {
  let controller: ApiController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ApiController],
    }).compile();

    controller = module.get<ApiController>(ApiController);
  });

  describe("apiGetHandler", () => {
    it("delegates request handling to a different controller based on module and action from query string", async () => {
      const request = mock<Request>();
      const next = jest.fn();
      await controller.apiGetHandler(request, next, ApiContractAction.GetAbi, ApiModule.Contract, {
        module: ApiModule.Contract,
        action: ApiContractAction.GetAbi,
        address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
      });

      expect(request.url).toBe(`/api/${ApiModule.Contract}/${ApiContractAction.GetAbi}`);
      expect(request.query).toEqual({
        address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
      });
      expect(next).toBeCalledTimes(1);
    });
  });

  describe("apiPostHandler", () => {
    it("delegates request handling to a different controller based on module and action from body string", async () => {
      const request = mock<Request>();
      const next = jest.fn();
      await controller.apiPostHandler(request, next, ApiContractAction.VerifySourceCode, ApiModule.Contract);

      expect(request.url).toBe(`/api/${ApiModule.Contract}/${ApiContractAction.VerifySourceCode}`);
      expect(next).toBeCalledTimes(1);
    });
  });

  describe("getContractAbi", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getContractAbi();
      expect(result).toBe(null);
    });
  });

  describe("getContractSourceCode", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getContractSourceCode();
      expect(result).toBe(null);
    });
  });

  describe("verifyContractSourceCode", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.verifyContractSourceCode();
      expect(result).toBe(null);
    });
  });

  describe("getVerificationStatus", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getVerificationStatus();
      expect(result).toBe(null);
    });
  });

  describe("getContractCreation", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getContractCreation();
      expect(result).toBe(null);
    });
  });

  describe("getTransactionStatus", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getTransactionStatus();
      expect(result).toBe(null);
    });
  });

  describe("getTransactionReceiptStatus", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getTransactionReceiptStatus();
      expect(result).toBe(null);
    });
  });

  describe("getAccountTransactions", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getAccountTransactions(
        {
          page: 1,
          offset: 10,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Desc }
      );
      expect(result).toBe(null);
    });
  });

  describe("getInternalTransactions", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getInternalTransactions(
        {
          page: 1,
          offset: 10,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Desc }
      );
      expect(result).toBe(null);
    });
  });

  describe("getAccountInternalTransactions", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getAccountInternalTransactions(
        {
          page: 1,
          offset: 10,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Desc }
      );
      expect(result).toBe(null);
    });
  });

  describe("getInternalTransactionsByTxHash", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getInternalTransactionsByTxHash(
        {
          page: 1,
          offset: 10,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Desc }
      );
      expect(result).toBe(null);
    });
  });

  describe("getAccountTokenTransfers", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getAccountTokenTransfers(
        {
          page: 1,
          offset: 10,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Desc }
      );
      expect(result).toBe(null);
    });
  });

  describe("getAccountNFTTransfers", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getAccountNFTTransfers(
        {
          page: 1,
          offset: 10,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Desc }
      );
      expect(result).toBe(null);
    });
  });

  describe("getAccountEtherBalance", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getAccountEtherBalance();
      expect(result).toBe(null);
    });
  });

  describe("getAccountsEtherBalances", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getAccountsEtherBalances();
      expect(result).toBe(null);
    });
  });

  describe("getAccountTokenBalance", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getAccountTokenBalance();
      expect(result).toBe(null);
    });
  });

  describe("getAccountMinedBlocks", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getAccountMinedBlocks({ page: 1, offset: 10, maxLimit: 1000 });
      expect(result).toBe(null);
    });
  });

  describe("getBlockNumberByTimestamp", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getBlockNumberByTimestamp();
      expect(result).toBe(null);
    });
  });

  describe("getBlockCountdown", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getBlockCountdown();
      expect(result).toBe(null);
    });
  });

  describe("getBlockRewards", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getBlockRewards();
      expect(result).toBe(null);
    });
  });

  describe("getLogs", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.getLogs({
        page: 1,
        offset: 10,
        maxLimit: 10000,
      });
      expect(result).toBe(null);
    });
  });

  describe("tokenInfo", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.tokenInfo();
      expect(result).toBe(null);
    });
  });

  describe("ethPrice", () => {
    it("returns null as it is defined only to appear in docs and cannot be called", async () => {
      const result = await controller.ethPrice();
      expect(result).toBe(null);
    });
  });
});
