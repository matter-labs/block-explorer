import { CounterCriteria } from "../common/types";
import config from "./counter.config";

export const getQueryString = <T>(counterCriteria: CounterCriteria<T>) => {
  const query = { ...counterCriteria };
  const searchParams = new URLSearchParams(query as Record<string, string>);
  searchParams.sort();
  return searchParams.toString();
};

const haveSameItems = (array1: string[], array2: string[]) => {
  if (array1.length !== array2.length) {
    return false;
  }
  const array1Sorted = array1.slice().sort();
  const array2Sorted = array2.slice().sort();
  return array1Sorted.every((value, index) => value === array2Sorted[index]);
};

export const isCounterSupported = <T>(tableName: string, counterCriteria: CounterCriteria<T>) => {
  if (!config[tableName]) {
    return false;
  }
  const criteria = Object.keys(counterCriteria);
  if (criteria.length && !config[tableName].criteriaList.find((cr: string[]) => haveSameItems(criteria, cr))) {
    return false;
  }
  return true;
};
