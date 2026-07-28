import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // No-op for API route.
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = sessionData.session.user.id;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role_type")
      .eq("id", user_id)
      .maybeSingle();

    if (profileError || !profileData?.role_type) {
      return NextResponse.json(
        { error: "Unable to verify user role." },
        { status: 500 },
      );
    }

    if (
      profileData.role_type !== "SK_Chairperson" &&
      profileData.role_type !== "SK_Treasurer"
    ) {
      return NextResponse.json(
        { error: "Forbidden: insufficient role." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { amount, purpose, barangay, official_address, blockchain_tx_hash } =
      body;

    if (
      amount == null ||
      !purpose ||
      !barangay ||
      !official_address ||
      !blockchain_tx_hash
    ) {
      return NextResponse.json(
        { error: "Missing required allocation fields." },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("allocations").insert([
      {
        user_id,
        amount,
        purpose,
        barangay,
        official_address,
        blockchain_tx_hash,
      },
    ]);

    if (error) {
      console.error("Allocation insert error:", error);
      return NextResponse.json(
        { error: "Failed to create allocation." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Allocation created successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
