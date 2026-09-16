import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { action, email, password, full_name, role = 'user' } = await request.json();

  console.log(`Received ${action} request with email: ${email}`);

  if (action === 'signup') {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password,
        full_name,
        role,
      });

    if (error) {
      console.error("Signup error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Signup successful:", data);
    return NextResponse.json({ data });
  }

  if (action === 'login') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error) {
      console.error("Login error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Login successful:", data);
    return NextResponse.json({ data });
  }

  console.error("Invalid action received:", action);
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}