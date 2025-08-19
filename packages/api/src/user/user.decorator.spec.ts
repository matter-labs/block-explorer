import { ExecutionContext } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { Request } from "express";
import { userFactory } from "./user.decorator";

describe("User Decorator", () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: Request;

  beforeEach(() => {
    mockRequest = mock<Request>();
    mockExecutionContext = mock<ExecutionContext>({
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    });
  });

  it("returns user object with address when request session has address and token", () => {
    mockRequest.session = {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      token: "jwt-token",
    };
    const result = userFactory(mockExecutionContext);
    expect(result).toEqual({
      address: mockRequest.session.address,
    });
  });

  it("returns null when request session has no address", () => {
    mockRequest.session = {
      token: "jwt-token",
    };
    const result = userFactory(mockExecutionContext);
    expect(result).toBeNull();
  });

  it("returns null when request session has no token", () => {
    mockRequest.session = {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    };
    const result = userFactory(mockExecutionContext);
    expect(result).toBeNull();
  });

  it("returns null when request session is undefined", () => {
    mockRequest.session = undefined;
    const result = userFactory(mockExecutionContext);
    expect(result).toBeNull();
  });

  it("returns null when request session is null", () => {
    mockRequest.session = null;
    const result = userFactory(mockExecutionContext);
    expect(result).toBeNull();
  });

  it("returns null when session address is undefined", () => {
    mockRequest.session = {
      address: undefined,
      token: "jwt-token",
    };
    const result = userFactory(mockExecutionContext);
    expect(result).toBeNull();
  });

  it("returns null when session token is undefined", () => {
    mockRequest.session = {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      token: undefined,
    };
    const result = userFactory(mockExecutionContext);
    expect(result).toBeNull();
  });

  describe("type checking", () => {
    it("returns UserParam type", () => {
      mockRequest.session = {
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        token: "jwt-token",
      };
      const result = userFactory(mockExecutionContext);
      if (result !== null) {
        expect(typeof result.address).toBe("string");
      } else {
        expect(result).toBeNull();
      }
    });
  });
});
