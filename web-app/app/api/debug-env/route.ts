import { NextResponse } from 'next/server';

export async function GET() {
  // Presence/length diagnostics are for local setup only.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    hasUrl: typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string',
    urlLen: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').length,
    hasKey: typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string',
    keyLen: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length,
  });
}
