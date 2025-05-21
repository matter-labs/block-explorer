import { mock, MockProxy } from "jest-mock-extended";
import { Request, Response } from "express";
import { PrividiumFilteringMiddleware } from "./prividium-filtering.middleware";
import { AddressService } from "../address/address.service";
import { LogService } from "../log/log.service";
import { ForbiddenException } from "@nestjs/common";
import { calculateSiwe } from "../../test/utils/siwe-message-tools";
import { SiweMessage } from "siwe";
import { Address } from "../address/address.entity";
import { Log } from "../log/log.entity";
import { zeroPadValue } from "ethers";

function buildAddress(address: string, bytecode: string): Address {
  const obj = {
    address: address,
    bytecode: bytecode,
    isEvmLike: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  Object.setPrototypeOf(obj, Address);
  return obj;
}

function buildLog(topics: string[]): Log {
  const obj = {
    number: 0,
    address: "0x01",
    topics: topics,
    data: "data",
    blockNumber: 10,
    transactionIndex: 10,
    logIndex: 1,
    timestamp: new Date().valueOf(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  Object.setPrototypeOf(obj, Log);
  return obj as unknown as Log;
}

describe("PrividiumFilteringMiddleware", () => {
  const someSecKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const someAddress = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
  const someOtherAddress = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
  const chainId = 300;

  let req: Request;
  let res: Response;
  let next;
  let userAddress: Address;

  let addressService: MockProxy<AddressService>;
  let logService: MockProxy<LogService>;

  let middleware: PrividiumFilteringMiddleware;

  let siwe: SiweMessage;
  beforeEach(async () => {
    req = mock<Request>();
    res = mock<Response>();
    next = jest.fn();

    addressService = mock<AddressService>();
    logService = mock<LogService>();

    middleware = new PrividiumFilteringMiddleware(addressService, logService);

    const { siwe: generated, address } = await calculateSiwe({
      nonce: "8r2cXq20yD3l5bomR",
      privateKey: someSecKey,
      chainId,
    });
    userAddress = buildAddress(address, "0x");

    siwe = generated;
  });

  it("allows traffic for unprotected routes", async () => {
    const routes = [
      "/auth",
      "/auth/foo",
      "/batches",
      "/batches/foo",
      "/blocks",
      "/blocks/foo",
      "/health",
      "/health/foo",
      "/ready",
      "/ready/foo",
      "/stats",
      "/stats/foo",
      "/tokens",
      "/tokens/foo",
    ];

    for (const route of routes) {
      req.originalUrl = route;
      await middleware.use(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  it("filters traffic for routes not whitelisted but that share prefix with whitelisted routes", async () => {
    req.originalUrl = "/health-sensitive";
    await expect(() => middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it("stops traffic for unknown routes", async () => {
    req.originalUrl = "/sensitive-data";
    await expect(() => middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it("/address filters traffic for EoA address that dont belong to current user", async () => {
    req.session.siwe = siwe;
    req.originalUrl = `/address/${someAddress}`;

    addressService.findOne.mockReturnValue(Promise.resolve(userAddress));

    await expect(() => middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it("/address filters traffic when address does not exists", async () => {
    req.session.siwe = siwe;
    req.originalUrl = `/address/${someAddress}`;

    addressService.findOne.mockReturnValue(Promise.resolve(null));

    await expect(() => middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it("/address allows when does not exists and belongs to user", async () => {
    req.session.siwe = siwe;
    req.originalUrl = `/address/${userAddress.address}`;

    addressService.findOne.mockReturnValue(Promise.resolve(null));

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("/address/ calls next to let the normal api handle the not found", async () => {
    req.session.siwe = siwe;
    req.originalUrl = `/address/`;

    addressService.findOne.mockReturnValue(Promise.resolve(null));

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("/address allows traffic when address belongs to current user", async () => {
    req.session.siwe = siwe;
    req.originalUrl = `/address/${userAddress.address}`;

    addressService.findOne.mockReturnValue(Promise.resolve(userAddress));

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("/address blocks traffic when address is a contract and user is not the owner", async () => {
    req.session.siwe = siwe;
    req.originalUrl = `/address/${someAddress}`;

    const contractAddress = buildAddress(someAddress, "0x010203");

    addressService.findOne.mockReturnValue(Promise.resolve(contractAddress));

    const log = buildLog([
      "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0",
      "0x01",
      zeroPadValue(someOtherAddress, 32),
    ]);
    logService.findManyByTopics.mockReturnValue(Promise.resolve([log]));

    await expect(() => middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it("/address allows traffic when address is contract and user is owner", async () => {
    req.session.siwe = siwe;
    req.originalUrl = `/address/${someAddress}`;

    const contractAddress = buildAddress(someAddress, "0x010203");

    addressService.findOne.mockReturnValue(Promise.resolve(contractAddress));

    const log = buildLog([
      "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0",
      "0x01",
      zeroPadValue(userAddress.address, 32),
    ]);
    logService.findManyByTopics.mockReturnValue(Promise.resolve([log]));

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("/address filters out traffic when address is a contract that is not ownable", async () => {
    req.session.siwe = siwe;
    req.originalUrl = `/address/${someAddress}`;

    const contractAddress = buildAddress(someAddress, "0x010203");

    addressService.findOne.mockReturnValue(Promise.resolve(contractAddress));
    logService.findManyByTopics.mockReturnValue(Promise.resolve([]));

    await expect(() => middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it("when url is /transactions/:id allows to continue", async () => {
    req.originalUrl = `/transactions/0xabcabc`;
    res.locals = {};
    await middleware.use(req, res, next);
    expect(res.locals).toEqual({});
  });

  it("when url is exactly /transactions allows to continue with extra filters", async () => {
    req.originalUrl = "/transactions";
    res.locals = { filterTransactionsOptions: {} };
    req.session.siwe = siwe;
    await middleware.use(req, res, next);
    expect(res.locals).toEqual({
      filterTransactionsOptions: {
        address: userAddress.address,
        filterAddressInLogTopics: true,
      },
    });
  });

  it("when url is exactly /transactions allows to continue with extra filters 2", async () => {
    req.originalUrl = "/transactions";
    res.locals = {};
    req.session.siwe = siwe;
    await middleware.use(req, res, next);
    expect(res.locals).toEqual({
      filterTransactionsOptions: {
        address: userAddress.address,
        filterAddressInLogTopics: true,
      },
    });
  });

  it("when url is /transactions and owner address query is provided, it filters by owner address", async () => {
    req.originalUrl = "/transactions";
    res.locals = {};
    req.session.siwe = siwe;
    req.query.address = userAddress.address;
    await middleware.use(req, res, next);
    expect(res.locals).toEqual({
      filterTransactionsOptions: {
        filterAddressInLogTopics: true,
      },
    });
  });

  it("when url is /transactions and other address query is provided, it filters by transactions between owner and other address", async () => {
    req.originalUrl = "/transactions";
    res.locals = {};
    req.session.siwe = siwe;
    req.query.address = someAddress;
    await middleware.use(req, res, next);
    expect(res.locals).toEqual({
      filterTransactionsOptions: {
        visibleBy: userAddress.address,
        filterAddressInLogTopics: true,
      },
    });
  });
});
