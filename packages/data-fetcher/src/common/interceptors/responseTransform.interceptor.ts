import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BigNumber } from "ethers";

const transform = (obj: any): any => {
  if (obj == null) {
    return obj;
  }
  if (obj instanceof Array) {
    obj.forEach(transform);
  }
  for (const propName in obj) {
    if (obj[propName] instanceof BigNumber) {
      obj[propName] = obj[propName].toString();
    } else if (obj[propName] instanceof Object) {
      transform(obj[propName]);
    }
  }
  return obj;
};

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => transform(data)));
  }
}
