type Stringy = { toString: () => string };

export function buildUrl(base: string, query: Record<string, Stringy>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, value.toString());
  }

  return `${base}?${params.toString()}`;
}
