import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

const REQUIRES_FULL_WRITE_ACCESS = "requiresFullWriteAccess";

// Marks an API handler that changes state, e.g. contract verification. In Prividium mode it can only be called
// with full write access (see WRITE_PERMISSIONS), full read access is not enough.
export const RequiresFullWriteAccess = () => SetMetadata(REQUIRES_FULL_WRITE_ACCESS, true);

// Registered globally in Prividium mode only. Relies on AuthMiddleware putting the caller's access on the request.
@Injectable()
export class FullWriteAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isRequired = this.reflector.getAllAndOverride<boolean>(REQUIRES_FULL_WRITE_ACCESS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isRequired) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.identity?.hasFullWriteAccess) {
      throw new ForbiddenException("Forbidden request");
    }
    return true;
  }
}
