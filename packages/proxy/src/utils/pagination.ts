export type Paginated<T> = {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
  links: {
    first: string;
    previous: string;
    next: string;
    last: string;
  };
};

export function wrapIntoPaginationInfo<T>(
  collection: T[],
  linksBaseUri: string,
  limit: number,
): Paginated<T> {
  return {
    items: collection,
    meta: {
      totalItems: collection.length,
      itemCount: collection.length,
      itemsPerPage: limit,
      totalPages: collection.length === 0 ? 0 : 1,
      currentPage: 1,
    },
    links: {
      first: `${linksBaseUri}?limit=${limit}`,
      previous: '',
      next: '',
      last: `${linksBaseUri}?page=1&limit=${limit}`,
    },
  };
}
