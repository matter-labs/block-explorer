export type CounterCriteria<T> = Array<`${keyof T & string}` | `${keyof T & string}|${keyof T & string}`>;
