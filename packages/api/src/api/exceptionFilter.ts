import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { Response } from "express";
import { ResponseStatus, ResponseMessage } from "./dtos/common/responseBase.dto";

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(200).json({
      status: ResponseStatus.NOTOK,
      message: ResponseMessage.NOTOK,
      result: exception.message,
    });
  }
}
