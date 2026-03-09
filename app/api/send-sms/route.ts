import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { to, message } = await request.json();

  const apiKey = process.env.SEMAPHORE_API_KEY;
  const senderName = process.env.SEMAPHORE_SENDER_NAME || "SafeLink";

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Semaphore API key not configured" },
      { status: 500 },
    );
  }

  // Strip spaces so number is like +639916032347 or 09916032347
  const cleanPhone = to.replace(/\s+|-/g, "");

  try {
    const res = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        number: cleanPhone,
        message,
        sendername: senderName,
      }),
    });

    const rawText = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: rawText },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
