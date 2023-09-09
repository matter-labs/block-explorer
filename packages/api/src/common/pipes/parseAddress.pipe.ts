import { BadRequestException } from "@nestjs/common";
import { PipeTransform, Injectable } from "@nestjs/common";

export const ADDRESS_REGEX_PATTERN = "^(0x)?[0-9a-fA-F]{40}$";

interface ParamOptions {
  required?: boolean;
  each?: boolean;
  errorMessage?: string;
}

@Injectable()
export class ParseAddressPipe implements PipeTransform<string | string[]> {
  private static addressRegexp = new RegExp(ADDRESS_REGEX_PATTERN);
  public readonly options: ParamOptions;

  constructor({ required = true, each = false, errorMessage = "Invalid Address format" }: ParamOptions = {}) {
    this.options = {
      required,
      each,
      errorMessage,
    };
  }

  public transform(value: string | string[]): string | string[] {
    if (!this.options.required && !value) {
      return value;
    }

    if (this.options.each) {
      if (!Array.isArray(value)) {
        throw new BadRequestException(this.options.errorMessage);
      }
      return value.map((item) => this.parseAddress(item));
    }

    if (typeof value !== "string") {
      throw new BadRequestException(this.options.errorMessage);
    }
    return this.parseAddress(value);
  }

  private parseAddress(address: string): string {
    if (!ParseAddressPipe.addressRegexp.test(address)) {
      throw new BadRequestException(this.options.errorMessage);
    }

    return address.toLowerCase();
  }
}
