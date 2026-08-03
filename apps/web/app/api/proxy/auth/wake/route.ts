import { NextRequest } from 'next/server';
import { handleWakeGet } from '@/lib/auth-handlers';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  return handleWakeGet(req);
}
