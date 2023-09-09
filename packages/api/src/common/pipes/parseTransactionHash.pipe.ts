import { BadRequestException } from "@nestjs/common";
import { PipeTransform, Injectable } from "@nestjs/common";

export const TX_HASH_REGEX_PATTERN = "^0x[0-9A-Fa-f]{64}$";

interface ParamOptions {
  required?: boolean;
  errorMessage?: string;
}

@Injectable()
export class ParseTransactionHashPipe implements PipeTransform<string> {
  private static transactionHashRegexp = new RegExp(TX_HASH_REGEX_PATTERN);
  public readonly options: ParamOptions;

  constructor({ required = true, errorMessage = "Invalid transaction hash format" }: ParamOptions = {}) {
    this.options = {
      required,
      errorMessage,
    };
  }

  public transform(value: string): string {
    if (!this.options.required && !value) {
      return value;
    }
    if (!ParseTransactionHashPipe.transactionHashRegexp.test(value)) {
      throw new BadRequestException(this.options.errorMessage);
    }

    return value;
  }
}
