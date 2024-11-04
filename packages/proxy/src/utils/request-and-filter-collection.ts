import { buildUrl } from './url.js';
import { enumeratedSchema } from './schemas.js';
import { wrapIntoPaginationInfo } from './pagination.js';
import { z, ZodTypeAny } from 'zod';

export async function requestAndFilterCollection<Parser extends ZodTypeAny>(
  baseUrl: string,
  query: Record<string, number | string>,
  schema: Parser,
  filter: (elem: z.infer<Parser>) => boolean,
  limit = 10,
) {
  const finalSchema = enumeratedSchema(schema);
  const res = await fetch(buildUrl(baseUrl, query))
    .then((res) => res.json())
    .then((json) => finalSchema.parse(json));

  const filtered = res.items.filter(filter);

  return wrapIntoPaginationInfo(filtered, baseUrl, limit);
}
