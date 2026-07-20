import { ArgumentMetadata, ParseIntPipe, ParseIntPipeOptions } from "@nestjs/common";

declare interface ParseLimitedIntPipeOptions extends ParseIntPipeOptions {
  min?: number;
  max?: number;
  isOptional?: boolean;
}

export class ParseLimitedIntPipe extends ParseIntPipe {
  constructor(protected readonly options?: ParseLimitedIntPipeOptions) {
    super(options);
  }

  public override async transform(value: string | number, metadata?: ArgumentMetadata): Promise<number> {
    if (!value && value !== 0 && this.options?.isOptional) {
      return undefined;
    }
    const parsedInt = await super.transform(value as string, metadata);
    let { min, max } = this.options || {};

    if (isNaN(min)) {
      min = 0;
    }
    if (isNaN(max)) {
      max = Number.MAX_SAFE_INTEGER;
    }

    if (parsedInt < min || parsedInt > max) {
      throw this.exceptionFactory(`Validation failed: specified int is out of defined boundaries: [${min};${max}].`);
    }

    return parsedInt;
  }
}
