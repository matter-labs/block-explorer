import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export type UserParam = {
  address: string;
} | null;

/* istanbul ignore next */
export const User = createParamDecorator<any, any, UserParam>((data: unknown, ctx: ExecutionContext) => {
  return userFactory(ctx);
});

export function userFactory(ctx: ExecutionContext): UserParam {
  const request: Request = ctx.switchToHttp().getRequest();
  const siwe = request.session?.siwe;

  if (!request.session?.verified || !siwe) {
    return null;
  }

  return { address: siwe.address };
}
