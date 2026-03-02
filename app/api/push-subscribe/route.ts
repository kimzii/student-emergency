import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  // Get the access token from the Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = authHeader.replace("Bearer ", "");

  // Create authenticated Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Verify user
  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subscription } = await req.json();
  if (!subscription || !subscription.endpoint) {
    return NextResponse.json(
      { error: "Subscription data is required." },
      { status: 400 }
    );
  }

  // Store the push subscription as JSON string in the token field
  const subscriptionString = JSON.stringify(subscription);

  // Check if token already exists for this user
  const { data: existingToken } = await supabase
    .from("push_tokens")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("token", subscriptionString)
    .single();

  if (existingToken) {
    return NextResponse.json({ success: true, message: "Already subscribed" });
  }

  // Insert new push token
  const { error: insertError } = await supabase.from("push_tokens").insert({
    user_id: userData.user.id,
    token: subscriptionString,
    platform: "web",
  });

  if (insertError) {
    console.error("Push token insert error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  // Get the access token from the Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = authHeader.replace("Bearer ", "");

  // Create authenticated Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Verify user
  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete all push tokens for this user
  const { error: deleteError } = await supabase
    .from("push_tokens")
    .delete()
    .eq("user_id", userData.user.id);

  if (deleteError) {
    console.error("Push token delete error:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
