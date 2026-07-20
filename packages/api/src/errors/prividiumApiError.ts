import { HttpException } from "@nestjs/common/exceptions/http.exception";

export class PrividiumApiError extends HttpException {
  constructor(response: string | Record<string, any>, status: number) {
    super(response, status);
  }
}
