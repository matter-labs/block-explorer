import { ArgumentsHost, BadGatewayException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { Request, Response } from "express";
import { SessionInvalidationFilter } from "./sessionInvalidation.filter";
import { PrividiumApiError } from "../errors/prividiumApiError";

describe("SessionInvalidationFilter", () => {
  const buildHost = (req: Request, res: Response): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
        getNext: () => jest.fn(),
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: () => "http",
    } as unknown as ArgumentsHost);

  let filter: SessionInvalidationFilter;
  let req: Request;
  let res: Response;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new SessionInvalidationFilter();
    // Stub the inherited BaseExceptionFilter.catch so we can isolate the session-nulling behavior.
    jest.spyOn(Object.getPrototypeOf(SessionInvalidationFilter.prototype), "catch").mockImplementation(jest.fn());
    req = mock<Request>();
    res = mock<Response>();
    host = buildHost(req, res);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("nulls req.session on 401 UnauthorizedException", () => {
    req.session = { address: "0x01", token: "tok" };
    filter.catch(new UnauthorizedException("nope"), host);
    expect(req.session).toBeNull();
  });

  it("nulls req.session on 401 PrividiumApiError", () => {
    req.session = { address: "0x01", token: "tok" };
    filter.catch(new PrividiumApiError("Authentication failed", 401), host);
    expect(req.session).toBeNull();
  });

  it("preserves req.session on 403 ForbiddenException", () => {
    const session = { address: "0x01", token: "tok" };
    req.session = session;
    filter.catch(new ForbiddenException("forbidden"), host);
    expect(req.session).toBe(session);
  });

  it("preserves req.session on 502 BadGatewayException", () => {
    const session = { address: "0x01", token: "tok" };
    req.session = session;
    filter.catch(new BadGatewayException("upstream down"), host);
    expect(req.session).toBe(session);
  });
});
