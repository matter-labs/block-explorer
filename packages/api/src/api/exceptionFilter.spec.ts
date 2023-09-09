import { mock } from "jest-mock-extended";
import { ArgumentsHost, HttpException } from "@nestjs/common";
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
  });
});
