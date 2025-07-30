import { Test, TestingModule } from "@nestjs/testing";
import { mock, MockProxy } from "jest-mock-extended";
import { NotFoundException } from "@nestjs/common";
import { Pagination } from "nestjs-typeorm-paginate";
import { TokenController } from "./token.controller";
import { TokenService } from "./token.service";
import { TransferService } from "../transfer/transfer.service";
import { Token } from "./token.entity";
import { Transfer } from "../transfer/transfer.entity";
import { PagingOptionsDto, PagingOptionsWithMaxItemsLimitDto } from "../common/dtos";
import { UserParam } from "../user/user.decorator";

describe("TokenController", () => {
  const tokenAddress = "tokenAddress";
  const pagingOptions: PagingOptionsDto = { limit: 10, page: 2 };
  const pagingOptionsWithLimit: PagingOptionsWithMaxItemsLimitDto = { ...pagingOptions, maxLimit: 10000 };
  let controller: TokenController;
  let serviceMock: TokenService;
  let transferServiceMock: TransferService;
  let token;

  beforeEach(async () => {
    serviceMock = mock<TokenService>();
    transferServiceMock = mock<TransferService>();

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
        await controller.getTokenTransfers(tokenAddress, pagingOptionsWithLimit, null);
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
        const result = await controller.getTokenTransfers(tokenAddress, pagingOptionsWithLimit, null);
        expect(result).toBe(tokenTransfers);
      });

      describe("when user is provided", () => {
        let user: MockProxy<UserParam>;
        const mockUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
        beforeEach(() => {
          user = mock<UserParam>({ address: mockUser });
        });

        it("includes visibleBy filter", async () => {
          await controller.getTokenTransfers(tokenAddress, pagingOptionsWithLimit, user);
          expect(transferServiceMock.findAll).toHaveBeenCalledTimes(1);
          expect(transferServiceMock.findAll).toHaveBeenCalledWith(
            {
              tokenAddress,
              isFeeOrRefund: false,
              visibleBy: mockUser,
            },
            {
              ...pagingOptionsWithLimit,
              route: `tokens/${tokenAddress}/transfers`,
            }
          );
        });
      });
    });

    describe("when token does not exist", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(false);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getTokenTransfers(tokenAddress, pagingOptionsWithLimit, null);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });
});
