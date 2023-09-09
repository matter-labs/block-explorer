import { BadRequestException } from "@nestjs/common";
import { PipeTransform, Injectable } from "@nestjs/common";
import { ApiModule, apiActionsMap } from "../types";

@Injectable()
export class ParseActionPipe implements PipeTransform<{ module: ApiModule; action: string }, string> {
  public transform(value: { module: ApiModule; action: string }): string {
    if (!apiActionsMap[value.module]?.includes(value.action)) {
      throw new BadRequestException("Error! Missing Or invalid Action name");
    }
    return value.action;
  }
}
