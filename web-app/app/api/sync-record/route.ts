import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { 
      type, 
      user_id, 
      blockchain_tx_hash, 
      contract_address,
      official_address, 
      barangay, 
      amount, 
      purpose 
    } = body;

    if (!type || !user_id || !blockchain_tx_hash || !amount) {
      return NextResponse.json(
        { error: 'Missing required sync fields.' },
        { status: 400 }
      );
    }

    const table = type === 'allocation' ? 'allocations' : 'expenses';

    const { data, error } = await supabaseAdmin
      .from(table)
      .insert([
        {
          user_id,
          blockchain_tx_hash,
          contract_address,
          official_address,
          barangay,
          amount,
          purpose
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database Sync Error:', error);
      return NextResponse.json(
        { error: 'Failed to record entry to database.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Record synchronized successfully.', data },
      { status: 201 }
    );

  } catch (err) {
    console.error('API Server Error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}