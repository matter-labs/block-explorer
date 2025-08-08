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

  describe("when request session has address and token", () => {
    const mockAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const mockToken = "jwt-token";

    beforeEach(() => {
      mockRequest.session = {
        address: mockAddress,
        token: mockToken,
      } as any;
    });

    it("returns user object with address", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toEqual({
        address: mockAddress,
      });
    });
  });

  describe("when request session has no address", () => {
    beforeEach(() => {
      mockRequest.session = {
        token: "jwt-token",
      } as any;
    });

    it("returns null", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toBeNull();
    });
  });

  describe("when request session has no token", () => {
    beforeEach(() => {
      mockRequest.session = {
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      } as any;
    });

    it("returns null", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toBeNull();
    });
  });

  describe("when request session is undefined", () => {
    beforeEach(() => {
      mockRequest.session = undefined;
    });

    it("returns null", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toBeNull();
    });
  });

  describe("when request session is null", () => {
    beforeEach(() => {
      mockRequest.session = null;
    });

    it("returns null", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toBeNull();
    });
  });

  describe("when session has empty address", () => {
    beforeEach(() => {
      mockRequest.session = {
        address: "",
        token: "jwt-token",
      } as any;
    });

    it("returns null", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toBeNull();
    });
  });

  describe("when session has empty token", () => {
    beforeEach(() => {
      mockRequest.session = {
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        token: "",
      } as any;
    });

    it("returns null", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toBeNull();
    });
  });

  describe("type checking", () => {
    it("should return UserParam type", () => {
      mockRequest.session = {
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        token: "jwt-token",
      } as any;

      const result = userFactory(mockExecutionContext);

      // Type assertion to ensure the result matches UserParam type
      if (result !== null) {
        expect(typeof result.address).toBe("string");
      } else {
        expect(result).toBeNull();
      }
    });
  });
});
