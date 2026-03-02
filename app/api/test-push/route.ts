import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:emergency@safelink.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

// Test endpoint to debug push notifications
export async function GET(req: NextRequest) {
  const logs: string[] = [];
  
  logs.push("=== Push Notification Debug ===");
  logs.push(`VAPID Public Key: ${vapidPublicKey ? "SET" : "MISSING"}`);
  logs.push(`VAPID Private Key: ${vapidPrivateKey ? "SET" : "MISSING"}`);
  logs.push(`Supabase Service Key: ${supabaseServiceKey ? "SET" : "MISSING"}`);
  
  if (!supabaseServiceKey) {
    logs.push("ERROR: SUPABASE_SERVICE_ROLE_KEY is not configured!");
    return NextResponse.json({ logs });
  }
  
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get all push tokens
  const { data: allTokens, error: tokensError } = await adminClient
    .from("push_tokens")
    .select("id, user_id, platform, created_at");
  
  if (tokensError) {
    logs.push(`ERROR fetching tokens: ${tokensError.message}`);
  } else {
    logs.push(`Total push tokens in database: ${allTokens?.length || 0}`);
    allTokens?.forEach((token, i) => {
      logs.push(`  Token ${i + 1}: user=${token.user_id.substring(0, 8)}..., platform=${token.platform}, created=${token.created_at}`);
    });
  }
  
  // Get all parent-student links
  const { data: allLinks, error: linksError } = await adminClient
    .from("parent_students")
    .select("parent_id, student_id");
  
  if (linksError) {
    logs.push(`ERROR fetching links: ${linksError.message}`);
  } else {
    logs.push(`Total parent-student links: ${allLinks?.length || 0}`);
    allLinks?.forEach((link, i) => {
      logs.push(`  Link ${i + 1}: parent=${link.parent_id.substring(0, 8)}..., student=${link.student_id.substring(0, 8)}...`);
    });
  }
  
  return NextResponse.json({ logs });
}

// POST to send a test notification to yourself
export async function POST(req: NextRequest) {
  const logs: string[] = [];
  
  // Get the access token from the Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized - include Bearer token" }, { status: 401 });
  }
  const accessToken = authHeader.replace("Bearer ", "");

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }
  
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  
  // Verify user
  const { data: userData, error: userError } = await adminClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  
  logs.push(`User: ${userData.user.id}`);
  
  // Get push tokens for this user
  const { data: pushTokens, error: pushError } = await adminClient
    .from("push_tokens")
    .select("token")
    .eq("user_id", userData.user.id);
  
  if (pushError) {
    logs.push(`ERROR: ${pushError.message}`);
    return NextResponse.json({ logs, error: pushError.message }, { status: 500 });
  }
  
  logs.push(`Found ${pushTokens?.length || 0} push tokens for your account`);
  
  if (!pushTokens || pushTokens.length === 0) {
    logs.push("No push tokens found! Make sure you've enabled notifications.");
    return NextResponse.json({ logs });
  }
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    logs.push("VAPID keys not configured");
    return NextResponse.json({ logs, error: "VAPID not configured" }, { status: 500 });
  }
  
  const notificationPayload = JSON.stringify({
    title: "🧪 Test Notification",
    body: "If you see this, push notifications are working!",
    url: "/parent/dashboard",
  });
  
  // Send to all user's devices
  for (const tokenRow of pushTokens) {
    try {
      const subscription = JSON.parse(tokenRow.token);
      logs.push(`Sending to: ${subscription.endpoint.substring(0, 60)}...`);
      const result = await webpush.sendNotification(subscription, notificationPayload);
      logs.push(`SUCCESS: Status ${result.statusCode}`);
    } catch (err: any) {
      logs.push(`FAILED: ${err.message}`);
      if (err.statusCode === 410) {
        logs.push("  Subscription expired - need to re-subscribe");
      }
    }
  }
  
  return NextResponse.json({ logs, success: true });
}
