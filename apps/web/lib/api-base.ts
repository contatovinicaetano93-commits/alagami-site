/** API agora vive dentro do próprio Next.js (app/api/v1) — sempre same-origin. */
export function getApiBaseUrl(): string {
  return "";
}

export function getApiV1Url(): string {
  return "/api/v1";
}

/**
 * Base absoluta de `/api/v1` para fetch no servidor (Node não resolve URL relativa).
 * No browser, preferir `getApiV1Url()` (same-origin relativo).
 */
export function getApiV1AbsoluteBase(origin?: string): string {
  const trimmedOrigin = origin?.replace(/\/$/, "");
  if (trimmedOrigin) return `${trimmedOrigin}/api/v1`;

  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (appUrl) return `${appUrl}/api/v1`;

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) {
    const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return `${host}/api/v1`;
  }

  return "http://localhost:3000/api/v1";
}

/** Lista de bases da API. No servidor usa URL absoluta; no client, relativa. */
export function getApiV1Fallbacks(origin?: string): string[] {
  if (typeof window === "undefined") {
    return [getApiV1AbsoluteBase(origin)];
  }
  return [getApiV1Url()];
}
