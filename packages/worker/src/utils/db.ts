import { EntityTarget, getMetadataArgsStorage } from "typeorm";

export const getTableNameForEntity = <T>(entityClass: EntityTarget<T>): string => {
  const table = getMetadataArgsStorage().tables.find((t) => t.target === entityClass);
  return table.name;
};
