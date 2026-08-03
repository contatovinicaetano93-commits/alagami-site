import { NextRequest, NextResponse } from 'next/server';
import { fetchApiWithRetry } from '@/lib/fetch-api-with-retry';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const res = await fetchApiWithRetry({
    path: '/health',
    origin: req.nextUrl.origin,
    maxAttemptsPerApi: 3,
  });

  if (!res) {
    return NextResponse.json({ ok: false, message: 'API offline ou demorou para responder' }, { status: 503 });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(
    { ok: res.ok, apiStatus: (data as { status?: string }).status ?? 'unknown' },
    { status: res.ok ? 200 : 503 },
  );
}
