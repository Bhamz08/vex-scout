import type { z } from 'zod';
import { PAGE_SIZE, PROXY_BASE, type Endpoint } from './endpoints';
import { pageSchema } from './schemas';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildUrl(base: string, endpoint: Endpoint, extra: Record<string, string | number> = {}): string {
  const url = new URL(base + endpoint.path, window.location.origin);
  for (const [key, value] of Object.entries({ ...endpoint.query, ...extra })) {
    if (value === undefined || value === '') continue;
    for (const v of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(v));
  }
  return url.toString();
}

async function getJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(0, 'Network error: you may be offline.');
  }
  if (res.status === 429) throw new ApiError(429, 'The VEX API rate limit was hit. Try again in a minute.');
  if (res.status === 503) throw new ApiError(503, 'Live data is not configured on this deployment.');
  if (!res.ok) throw new ApiError(res.status, `VEX API request failed (${res.status}).`);
  return res.json();
}

function parse<S extends z.ZodTypeAny>(schema: S, data: unknown, url: string): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Surfacing the path makes upstream contract changes easy to diagnose.
    const issue = result.error.issues[0];
    throw new ApiError(200, `Unexpected API response from ${new URL(url).pathname} (${issue?.path.join('.') ?? '?'}: ${issue?.message ?? 'invalid'})`);
  }
  return result.data;
}

export async function getOne<S extends z.ZodTypeAny>(schema: S, endpoint: Endpoint, base = PROXY_BASE): Promise<z.infer<S>> {
  const url = buildUrl(base, endpoint);
  return parse(schema, await getJson(url), url);
}

/** Fetches every page of a paginated list endpoint (capped to avoid runaway loops). */
export async function getAll<S extends z.ZodTypeAny>(item: S, endpoint: Endpoint, maxPages = 20): Promise<Array<z.infer<S>>> {
  const schema = pageSchema(item);
  const out: Array<z.infer<S>> = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = buildUrl(PROXY_BASE, endpoint, { page, per_page: PAGE_SIZE });
    const body = parse(schema, await getJson(url), url);
    out.push(...body.data);
    if (body.meta.current_page >= body.meta.last_page) break;
  }
  return out;
}
