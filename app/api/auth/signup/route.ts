import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { email, password, fullName, role, phoneNumber } = await req.json();

  if (!email || !password || !fullName || !role || !phoneNumber) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Create profile in profiles table
  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: fullName,
      role,
      phone_number: phoneNumber,
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Don't fail signup if profile creation fails
    }
  }

  return NextResponse.json({
    user: data.user,
    session: data.session,
    message: "Check your email for a confirmation link.",
  });
}
