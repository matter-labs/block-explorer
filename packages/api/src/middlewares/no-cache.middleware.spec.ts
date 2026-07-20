import { mock } from "jest-mock-extended";
import { Request, Response } from "express";
import { NoCacheMiddleware } from "./no-cache.middleware";

describe("NoCacheMiddleware", () => {
  it("should set the correct headers", () => {
    const req = mock<Request>();
    const res = mock<Response>();
    const next = jest.fn();
    const middleware = new NoCacheMiddleware();
    middleware.use(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Surrogate-Control", "no-store");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    expect(res.setHeader).toHaveBeenCalledWith("Expires", "0");
    expect(next).toHaveBeenCalled();
  });
});
