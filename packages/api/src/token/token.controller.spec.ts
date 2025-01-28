import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { NotFoundException } from "@nestjs/common";
import { Pagination } from "nestjs-typeorm-paginate";
import { TokenController } from "./token.controller";
import { TokenService } from "./token.service";
import { TransferService } from "../transfer/transfer.service";
import { Token } from "./token.entity";
import { Transfer } from "../transfer/transfer.entity";
import { PagingOptionsDto, PagingOptionsWithMaxItemsLimitDto } from "../common/dtos";
import { BalanceForHolderDto } from "../balance/balanceForHolder.dto";
import { BalanceService } from "../balance/balance.service";

describe("TokenController", () => {
  const tokenAddress = "tokenAddress";
  const pagingOptions: PagingOptionsDto = { limit: 10, page: 2 };
  const pagingOptionsWithLimit: PagingOptionsWithMaxItemsLimitDto = { ...pagingOptions, maxLimit: 10000 };
  let controller: TokenController;
  let serviceMock: TokenService;
  let transferServiceMock: TransferService;
  let balanceServiceMock: BalanceService;
  let token;

  beforeEach(async () => {
    serviceMock = mock<TokenService>();
    transferServiceMock = mock<TransferService>();
    balanceServiceMock = mock<BalanceService>();

    token = {
      l2Address: "tokenAddress",
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenController],
      providers: [
        {
          provide: TokenService,
          useValue: serviceMock,
        },
        {
          provide: TransferService,
          useValue: transferServiceMock,
        },
        {
          provide: BalanceService,
          useValue: balanceServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TokenController>(TokenController);
  });

  describe("getTokens", () => {
    const tokens = mock<Pagination<Token>>();
    beforeEach(() => {
      (serviceMock.findAll as jest.Mock).mockResolvedValueOnce(tokens);
    });

    it("queries tokens with the specified options", async () => {
      await controller.getTokens(pagingOptions, 1000);
      expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
      expect(serviceMock.findAll).toHaveBeenCalledWith(
        { minLiquidity: 1000 },
        { ...pagingOptions, filterOptions: { minLiquidity: 1000 }, route: "tokens" }
      );
    });

    it("returns the tokens", async () => {
      const result = await controller.getTokens(pagingOptions);
      expect(result).toBe(tokens);
    });
  });

  describe("getToken", () => {
    describe("when token exists", () => {
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValue(token);
      });

      it("queries tokens by specified token address", async () => {
        await controller.getToken(tokenAddress);
        expect(serviceMock.findOne).toHaveBeenCalledTimes(1);
        expect(serviceMock.findOne).toHaveBeenCalledWith(tokenAddress);
      });

      it("returns the token", async () => {
        const result = await controller.getToken(tokenAddress);
        expect(result).toBe(token);
      });
    });

    describe("when token does not exist", () => {
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValueOnce(null);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getToken(tokenAddress);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });

  describe("getTokenTransfers", () => {
    const tokenTransfers = mock<Pagination<Transfer>>();
    describe("when token exists", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(true);
        (transferServiceMock.findAll as jest.Mock).mockResolvedValueOnce(tokenTransfers);
      });

      it("queries transfers with the specified options", async () => {
        await controller.getTokenTransfers(tokenAddress, pagingOptionsWithLimit);
        expect(transferServiceMock.findAll).toHaveBeenCalledTimes(1);
        expect(transferServiceMock.findAll).toHaveBeenCalledWith(
          {
            tokenAddress,
            isFeeOrRefund: false,
          },
          {
            ...pagingOptionsWithLimit,
            route: `tokens/${tokenAddress}/transfers`,
          }
        );
      });

      it("returns token transfers", async () => {
        const result = await controller.getTokenTransfers(tokenAddress, pagingOptionsWithLimit);
        expect(result).toBe(tokenTransfers);
      });
    });

    describe("when token does not exist", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(false);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getTokenTransfers(tokenAddress, pagingOptionsWithLimit);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });
  describe("getTokenHolders", () => {
    const tokenHolders = mock<Pagination<BalanceForHolderDto>>();
    describe("when token exists", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(true);
        (balanceServiceMock.getBalancesForTokenAddress as jest.Mock).mockResolvedValueOnce(tokenHolders);
      });

      it("queries transfers with the specified options", async () => {
        await controller.getTokenHolders(tokenAddress, pagingOptionsWithLimit);
        expect(balanceServiceMock.getBalancesForTokenAddress).toHaveBeenCalledTimes(1);
        expect(balanceServiceMock.getBalancesForTokenAddress).toHaveBeenCalledWith(tokenAddress, {
          ...pagingOptionsWithLimit,
          route: `tokens/${tokenAddress}/holders`,
        });
      });

      it("returns token transfers", async () => {
        const result = await controller.getTokenHolders(tokenAddress, pagingOptionsWithLimit);
        expect(result).toBe(tokenHolders);
      });
    });

    describe("when token does not exist", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(false);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getTokenHolders(tokenAddress, pagingOptionsWithLimit);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });
});
