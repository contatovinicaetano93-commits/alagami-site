import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchApiWithRetry } from '@/lib/fetch-api-with-retry';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const token = (await cookies()).get('access_token')?.value;
  const res = await fetchApiWithRetry({
    path: '/manager/dashboard',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    origin: req.nextUrl.origin,
    maxAttemptsPerApi: 3,
  });

  if (!res) {
    return NextResponse.json(
      { message: 'API indisponível no momento. Tente novamente em instantes.' },
      { status: 503 },
    );
  }

  const body = await res.json().catch(() => null);
  const payload =
    body && typeof body === 'object'
      ? body
      : {
          message: res.ok
            ? 'Resposta vazia da API'
            : 'Erro ao carregar painel do gestor',
        };

  return NextResponse.json(payload, { status: res.status });
}
