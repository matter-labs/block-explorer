import { FastifyError } from '@fastify/error';

export class HttpError extends Error implements FastifyError {
  statusCode: number;
  code: string;

  constructor(msg: string, status: number) {
    super(msg);
    this.code = msg.toLowerCase();
    this.statusCode = status;
  }
}

export class ExternalRpcError extends Error {
  private code: number;
  private data: unknown;

  constructor(code: number, message: string, data: unknown) {
    super('rpc error');
    this.code = code;
    this.message = message;
    this.data = data;
  }

  getErrorCode(): number {
    return this.code;
  }

  getErrorMessage(): string {
    return this.message;
  }

  getErrorData(): unknown {
    return this.data;
  }
}