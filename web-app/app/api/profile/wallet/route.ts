import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress, verifyMessage } from "viem";

export const runtime = "nodejs";

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error("Wallet binding is missing required Supabase configuration.");
    return errorResponse("Server configuration error.", 500);
  }

  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return errorResponse("Unauthenticated. Valid session cookie required.", 401);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return errorResponse("Request body must contain valid JSON.", 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return errorResponse("Request body must be a JSON object.", 400);
  }

  const { address, message, signature, timestamp } = payload as Record<
    string,
    unknown
  >;

  if (
    typeof address !== "string" ||
    !isAddress(address) ||
    typeof message !== "string" ||
    typeof signature !== "string" ||
    !/^0x[0-9a-fA-F]{130}$/.test(signature) ||
    typeof timestamp !== "number" ||
    !Number.isSafeInteger(timestamp)
  ) {
    return errorResponse("Invalid wallet binding request.", 400);
  }

  if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
    return errorResponse("Wallet binding request has expired.", 400);
  }

  const normalizedAddress = getAddress(address);
  const expectedMessage = [
    "SK-Ledge wallet binding",
    `User: ${user.id}`,
    `Address: ${normalizedAddress}`,
    `Timestamp: ${timestamp}`,
  ].join("\n");

  if (message !== expectedMessage) {
    return errorResponse("Wallet binding message is invalid.", 400);
  }

  let verified = false;
  try {
    verified = await verifyMessage({
      address: normalizedAddress,
      message: expectedMessage,
      signature: signature as `0x${string}`,
    });
  } catch (error) {
    console.error("Wallet signature verification failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Wallet signature could not be verified.", 400);
  }

  if (!verified) {
    return errorResponse("Wallet signature could not be verified.", 400);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ wallet_address: normalizedAddress })
    .eq("id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return errorResponse("This wallet is already bound to another profile.", 409);
    }

    console.error("Failed to save bound wallet.", { code: updateError.code });
    return errorResponse("Failed to save wallet binding.", 500);
  }

  return NextResponse.json({ wallet_address: normalizedAddress });
}
