import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";
import { PagingOptionsDto } from "../dtos";

export function MaxItemsLimit(maxLimit: number, validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "maxItemsLimit",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const paginationOptions = args.object as PagingOptionsDto;
          return value * paginationOptions.limit <= maxLimit;
        },
      },
    });
  };
}
