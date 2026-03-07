import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:emergency@safelink.app",
    vapidPublicKey,
    vapidPrivateKey,
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

  // Fetch location name using Google Maps Geocoding API
  let location_name = "Unknown location";
  try {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`,
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (
          geoData.status === "OK" &&
          geoData.results &&
          geoData.results.length > 0
        ) {
          location_name = geoData.results[0].formatted_address;
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch location name from Google Maps:", err);
  }

  // Insert emergency event with location_name
  const { data, error } = await supabase
    .from("emergency_events")
    .insert({
      student_id: userData.user.id,
      lat,
      lng,
      location_name,
    })
    .select()
    .single();

  if (error) {
    console.log("Emergency insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Get student name
  const studentName = userData.user.user_metadata?.full_name || "Your child";

  // Use service role client to bypass RLS for querying parent data and push tokens
  if (!supabaseServiceKey) {
    console.error("[Emergency] SUPABASE_SERVICE_ROLE_KEY not configured");
    return NextResponse.json({
      success: true,
      data,
      warning: "Push notifications not configured",
    });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // Get linked parents
  console.log(
    "[Emergency] Looking for linked parents for student:",
    userData.user.id,
  );
  const { data: parentLinks, error: parentLinksError } = await adminClient
    .from("parent_students")
    .select("parent_id")
    .eq("student_id", userData.user.id);

  console.log(
    "[Emergency] Parent links found:",
    parentLinks,
    "Error:",
    parentLinksError,
  );

  if (parentLinks && parentLinks.length > 0) {
    const parentIds = parentLinks.map((link) => link.parent_id);
    console.log("[Emergency] Parent IDs:", parentIds);

    // Get parent profiles with preferences and phone numbers (optional columns)
    const { data: parentProfiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, phone_number, sms_enabled, notif_enabled")
      .in("id", parentIds);

    console.log(
      "[Emergency] Parent profiles:",
      parentProfiles,
      "Error:",
      profilesError,
    );

    // Send SMS to parents with sms_enabled (only if explicitly enabled)
    if (parentProfiles) {
      for (const parent of parentProfiles) {
        if (parent.sms_enabled === true && parent.phone_number) {
          try {
            const smsRes = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-sms`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: parent.phone_number,
                  message: `🚨 Emergency Alert! ${studentName} has triggered an SOS at ${location_name}. Location: https://www.google.com/maps?q=${lat},${lng}`,
                }),
              },
            );
            console.log(
              "[Emergency] SMS sent to:",
              parent.phone_number,
              "Result:",
              smsRes.status,
            );
          } catch (err) {
            console.error("[Emergency] SMS send error:", err);
          }
        }
      }
    }

    // ALWAYS get push tokens for ALL linked parents (don't filter by preferences)
    // Push notifications should always be sent - they were working before
    const { data: pushTokens, error: pushTokensError } = await adminClient
      .from("push_tokens")
      .select("token")
      .in("user_id", parentIds);

    console.log(
      "[Emergency] Push tokens found:",
      pushTokens?.length || 0,
      "Error:",
      pushTokensError,
    );

    if (
      pushTokens &&
      pushTokens.length > 0 &&
      vapidPublicKey &&
      vapidPrivateKey
    ) {
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
          console.log(
            "[Emergency] Sending push to subscription endpoint:",
            subscription.endpoint?.substring(0, 50) + "...",
          );
          const result = await webpush.sendNotification(
            subscription,
            notificationPayload,
          );
          console.log("[Emergency] Push sent successfully:", result.statusCode);
        } catch (err) {
          console.error("[Emergency] Push notification error:", err);
          // If push fails (e.g., expired subscription), we could delete it
        }
      });

      await Promise.allSettled(pushPromises);
    }
  }

  return NextResponse.json({ success: true, data });
}
