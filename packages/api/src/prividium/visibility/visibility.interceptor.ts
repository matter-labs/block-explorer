import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Observable, from } from "rxjs";
import { switchMap } from "rxjs/operators";
import { AddUserRolesPipe, UserWithRoles } from "../../api/pipes/addUserRoles.pipe";
import { VisibilityContext } from "./visibility.context";

@Injectable()
export class VisibilityInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const sessionUser = request.session as { address?: string; token?: string } | undefined;
    const authHeaderToken = request.headers?.authorization?.split(" ")[1];

    const addUserRolesPipe = new AddUserRolesPipe(this.configService);

    const userPromise = (async (): Promise<UserWithRoles | null> => {
      if (sessionUser?.token || authHeaderToken) {
        try {
          return await addUserRolesPipe.transform({
            address: sessionUser?.address ?? "",
            token: sessionUser?.token ?? authHeaderToken,
          });
        } catch {
          return null;
        }
      }
      return null;
    })();

    return from(userPromise).pipe(
      switchMap((user) => {
        const visibilityContext: VisibilityContext = {
          isAdmin: !!user?.isAdmin,
          userAddress: user?.address,
          token: user?.token,
        };
        request.visibilityContext = visibilityContext;
        return next.handle();
      })
    );
  }
}
