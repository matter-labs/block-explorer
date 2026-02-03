import { ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException } from "@nestjs/common";
import { Response } from "express";
import { ResponseStatus, ResponseMessage } from "./dtos/common/responseBase.dto";
import { PrividiumApiError } from "../errors/prividiumApiError";

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let validationErrorMessage;
    // support of DTO validation error messages
    if (exception instanceof BadRequestException) {
      const response: { message: string[] } = <{ message: string[] }>(<BadRequestException>exception).getResponse();
      validationErrorMessage = response.message instanceof Array ? response.message[0] : response.message;
    }

    if (exception instanceof PrividiumApiError) {
      const req = ctx.getRequest();
      req.session = null;
    }

    response.status(200).json({
      status: ResponseStatus.NOTOK,
      message: ResponseMessage.NOTOK,
      result: validationErrorMessage || exception.message,
    });
  }
}
