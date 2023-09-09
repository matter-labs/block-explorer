import { FindOperator } from "typeorm";

export const transformFindOperator = (value: FindOperator<any>, transform: (value: any) => any) =>
  new FindOperator(
    value.type,
    Array.isArray(value.value) ? value.value.map((value) => transform(value)) : transform(value.value),
    value.useParameter,
    value.multipleParameters
  );
