import { Controller, ExecutionContext, ForbiddenException, Post } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { FullWriteAccessGuard, RequiresFullWriteAccess } from "./fullWriteAccess.guard";

@Controller()
class TestController {
  @Post("write")
  @RequiresFullWriteAccess()
  public write() {
    return null;
  }

  @Post("read")
  public read() {
    return null;
  }
}

const buildContext = (handler: () => unknown, identity?: Request["identity"]): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ identity }) }),
  } as unknown as ExecutionContext);

describe("FullWriteAccessGuard", () => {
  const guard = new FullWriteAccessGuard(new Reflector());

  it("allows handlers that don't require full write access", () => {
    expect(guard.canActivate(buildContext(TestController.prototype.read))).toBe(true);
  });

  it("allows a marked handler to callers with full write access", () => {
    const context = buildContext(TestController.prototype.write, {
      hasFullReadAccess: true,
      hasFullWriteAccess: true,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("forbids a marked handler to callers with full read access only", () => {
    const context = buildContext(TestController.prototype.write, {
      hasFullReadAccess: true,
      hasFullWriteAccess: false,
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("forbids a marked handler when the caller's access is unknown", () => {
    expect(() => guard.canActivate(buildContext(TestController.prototype.write))).toThrow(ForbiddenException);
  });
});
