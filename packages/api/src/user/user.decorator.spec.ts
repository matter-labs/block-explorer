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

  describe("when request session is verified and has siwe data", () => {
    const mockAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    beforeEach(() => {
      mockRequest.session = {
        verified: true,
        siwe: {
          address: mockAddress,
        },
      } as any;
    });

    it("returns user object with address", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toEqual({
        address: mockAddress,
      });
    });
  });

  describe("when request session is not verified", () => {
    beforeEach(() => {
      mockRequest.session = {
        verified: false,
        siwe: {
          address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        },
      } as any;
    });

    it("returns null", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toBeNull();
    });
  });

  describe("when request session does not have siwe data", () => {
    beforeEach(() => {
      mockRequest.session = {
        verified: true,
        siwe: undefined,
      } as any;
    });

    it("returns null", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toBeNull();
    });
  });

  describe("when request session has null siwe data", () => {
    beforeEach(() => {
      mockRequest.session = {
        verified: true,
        siwe: null,
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

  describe("when session is verified but siwe has no address", () => {
    beforeEach(() => {
      mockRequest.session = {
        verified: true,
        siwe: {
          // missing address property
        },
      } as any;
    });

    it("returns user object with undefined address", () => {
      const result = userFactory(mockExecutionContext);

      expect(result).toEqual({
        address: undefined,
      });
    });
  });

  describe("type checking", () => {
    it("should return UserParam type", () => {
      mockRequest.session = {
        verified: true,
        siwe: {
          address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        },
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
