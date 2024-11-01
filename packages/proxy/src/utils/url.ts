type Stringy = { toString: () => string };

export function buildUrl(base: string, query: Record<string, Stringy>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, value.toString());
  }
  const serializedParams = params.toString();

  return `${base}${serializedParams.length === 0 ? '' : `?${serializedParams}`}`;
}
