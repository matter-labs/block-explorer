import { BadRequestException } from "@nestjs/common";
import { PipeTransform, Injectable } from "@nestjs/common";
import { ApiModule } from "../types";

@Injectable()
export class ParseModulePipe implements PipeTransform<string> {
  public transform(value: ApiModule): ApiModule {
    if (!Object.values(ApiModule).includes(value)) {
      throw new BadRequestException("Error! Missing Or invalid Module name");
    }
    return value;
  }
}
