import { mock } from "jest-mock-extended";
import { ArgumentsHost, HttpException, BadRequestException } from "@nestjs/common";
import { ResponseStatus, ResponseMessage } from "./dtos/common/responseBase.dto";
import { ApiExceptionFilter } from "./exceptionFilter";

describe("ApiExceptionFilter", () => {
  describe("catch", () => {
    it("sends http 200 response with exception message in result", () => {
      const exception = mock<HttpException>({
        message: "error",
      } as HttpException);
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const ctx = {
        getResponse: jest.fn().mockReturnValue(response),
      };
      const host = mock<ArgumentsHost>({
        switchToHttp: jest.fn().mockReturnValue(ctx),
      });

      const exceptionFilter = new ApiExceptionFilter();
      exceptionFilter.catch(exception, host);

      expect(response.status).toBeCalledWith(200);
      expect(response.json).toBeCalledWith({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: exception.message,
      });
    });

    it("sends http 200 response with exception message for BadRequestException with no validation message", () => {
      const exception = mock<BadRequestException>({
        message: "error",
      } as BadRequestException);
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const ctx = {
        getResponse: jest.fn().mockReturnValue(response),
      };
      const host = mock<ArgumentsHost>({
        switchToHttp: jest.fn().mockReturnValue(ctx),
      });

      const exceptionFilter = new ApiExceptionFilter();
      exceptionFilter.catch(exception, host);

      expect(response.status).toBeCalledWith(200);
      expect(response.json).toBeCalledWith({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: exception.message,
      });
    });

    it("sends http 200 response with validation message for BadRequestException with single validation message", () => {
      const exception = new BadRequestException({ message: "validation error" });
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const ctx = {
        getResponse: jest.fn().mockReturnValue(response),
      };
      const host = mock<ArgumentsHost>({
        switchToHttp: jest.fn().mockReturnValue(ctx),
      });

      const exceptionFilter = new ApiExceptionFilter();
      exceptionFilter.catch(exception, host);

      expect(response.status).toBeCalledWith(200);
      expect(response.json).toBeCalledWith({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: "validation error",
      });
    });

    it("sends http 200 response with first validation message for BadRequestException with multiple validation messages", () => {
      const exception = new BadRequestException({
        message: ["validation error 1", "validation error 2"],
      });
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const ctx = {
        getResponse: jest.fn().mockReturnValue(response),
      };
      const host = mock<ArgumentsHost>({
        switchToHttp: jest.fn().mockReturnValue(ctx),
      });

      const exceptionFilter = new ApiExceptionFilter();
      exceptionFilter.catch(exception, host);

      expect(response.status).toBeCalledWith(200);
      expect(response.json).toBeCalledWith({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: "validation error 1",
      });
    });
  });
});
