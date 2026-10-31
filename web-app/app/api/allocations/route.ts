import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Endpoint deprecated. Please submit allocation sync requests to /api/sync-record." },
    { status: 410 }
  );
}