import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";

/**
 * Nulls req.session on any 401 so cookie-session emits a clearing Set-Cookie alongside the
 * 401 response. Needed because the @User(AddUserRolesPipe) parameter pipe revalidates the
 * upstream JWT after the auth middleware has already refreshed the cookie — if the pipe
 * then rejects, the cookie would otherwise be sent back refreshed instead of cleared.
 */
@Catch(HttpException)
export class SessionInvalidationFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    if (exception.getStatus() === 401) {
      const req = host.switchToHttp().getRequest<Request>();
      req.session = null;
    }
    super.catch(exception, host);
  }
}
