import { getApiV1Fallbacks } from '@/lib/api-base';
import { RESILIENCE_TIMEOUTS, sleep } from '@/lib/resilience';

export type FetchApiWithRetryOptions = {
  path: string;
  method?: string;
  body?: string | FormData | ArrayBuffer | Blob;
  headers?: Record<string, string>;
  maxAttemptsPerApi?: number;
  /** @deprecated API é same-origin — wake do Render não é mais necessário. */
  wakeFirst?: boolean;
  /** Origin absoluto (ex: req.nextUrl.origin) para fetch server-side. */
  origin?: string;
};

/**
 * Chamada à API embutida com retry curto.
 * No servidor, usa URL absoluta (Node não resolve paths relativos).
 */
export async function fetchApiWithRetry({
  path,
  method = 'GET',
  body,
  headers = {},
  maxAttemptsPerApi = 3,
  origin,
}: FetchApiWithRetryOptions): Promise<Response | null> {
  const apis = getApiV1Fallbacks(origin);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  for (const api of apis) {
    for (let attempt = 0; attempt < maxAttemptsPerApi; attempt++) {
      const hasBody =
        body !== undefined && method !== "GET" && method !== "HEAD";
      const res = await fetch(`${api}${normalizedPath}`, {
        method,
        headers,
        body: hasBody ? body : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(RESILIENCE_TIMEOUTS.request),
      }).catch(() => null);

      if (!res) {
        await sleep(400 * (attempt + 1));
        continue;
      }

      if (res.ok || res.status === 401 || res.status === 403 || res.status === 404) {
        return res;
      }

      if (res.status >= 500 || res.status === 503 || res.status === 502 || res.status === 504) {
        await sleep(500 * (attempt + 1));
        continue;
      }

      return res;
    }
  }

  return null;
}
