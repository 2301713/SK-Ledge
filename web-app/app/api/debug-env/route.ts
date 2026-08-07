import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasUrl: typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string',
    urlLen: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').length,
    hasKey: typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string',
    keyLen: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length,
  });
}
