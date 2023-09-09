import { Matches, ValidationOptions } from "class-validator";

const isoDateRegExp = new RegExp("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z", "i");

export const IsISODateString = (
  validationOptions: ValidationOptions = {
    message: "Not a valid ISO date string. Example: 2020-04-25T00:43:26.000Z",
  }
) => {
  return Matches(isoDateRegExp, validationOptions);
};
