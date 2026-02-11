import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { VisibilityContext } from "./visibility.context";

export const Visibility = createParamDecorator((_data: unknown, ctx: ExecutionContext): VisibilityContext => {
  const request = ctx.switchToHttp().getRequest();
  return request.visibilityContext as VisibilityContext;
});
