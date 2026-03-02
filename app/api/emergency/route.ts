import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

  const { lat, lng } = await req.json();
  if (lat == null || lng == null) {
    return NextResponse.json(
      { error: "lat and lng are required." },
      { status: 400 },
    );
  }

  // Insert emergency event with the authenticated user's id as student_id
  const { data, error } = await supabase
    .from("emergency_events")
    .insert({
      student_id: userData.user.id,
      lat,
      lng,
    })
    .select()
    .single();

  if (error) {
    console.log("Emergency insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Get student name
  const studentName =
    userData.user.user_metadata?.full_name || "Your child";

  // Get linked parents
  const { data: parentLinks } = await supabase
    .from("parent_students")
    .select("parent_id")
    .eq("student_id", userData.user.id);

  if (parentLinks && parentLinks.length > 0) {
    const parentIds = parentLinks.map((link) => link.parent_id);

    // Get push tokens for all linked parents
    const { data: pushTokens } = await supabase
      .from("push_tokens")
      .select("token")
      .in("user_id", parentIds);

    if (pushTokens && pushTokens.length > 0 && vapidPublicKey && vapidPrivateKey) {
      // Send push notifications to all parent devices
      const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      const notificationPayload = JSON.stringify({
        title: "🚨 Emergency Alert!",
        body: `${studentName} has triggered an SOS! Tap to see their location.`,
        url: `/parent/dashboard`,
        lat,
        lng,
      });

      const pushPromises = pushTokens.map(async (tokenRow) => {
        try {
          const subscription = JSON.parse(tokenRow.token);
          await webpush.sendNotification(subscription, notificationPayload);
        } catch (err) {
          console.error("Push notification error:", err);
          // If push fails (e.g., expired subscription), we could delete it
        }
      });

      await Promise.allSettled(pushPromises);
    }
  }

  return NextResponse.json({ success: true, data });
}
