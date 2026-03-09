import { NextResponse } from "next/server";

export async function GET() {
  const semaphoreKey = process.env.SEMAPHORE_API_KEY;
  const senderName = process.env.SEMAPHORE_SENDER_NAME || "SafeLink";

  const logs: string[] = [];
  logs.push(`SEMAPHORE_API_KEY: ${semaphoreKey ? "SET" : "MISSING"}`);

  if (!semaphoreKey) {
    return NextResponse.json({
      success: false,
      logs,
      error: "SEMAPHORE_API_KEY not set in env",
    });
  }

  try {
    const res = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: semaphoreKey,
        number: "+639916032347",
        message: "✅ SafeLink test SMS - Semaphore is working!",
        sendername: senderName,
      }),
    });

    const rawText = await res.text();
    logs.push(`Response status: ${res.status}`);
    logs.push(`Response: ${rawText}`);

    if (res.ok) {
      return NextResponse.json({ success: true, logs });
    } else {
      return NextResponse.json({
        success: false,
        logs,
        error: rawText,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logs.push(`Error: ${message}`);
    return NextResponse.json({ success: false, logs, error: message });
  }
}
