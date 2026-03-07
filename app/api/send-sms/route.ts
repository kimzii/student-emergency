import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(request: Request) {
  const { to, message } = await request.json();

  // Twilio credentials from environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;

  const client = twilio(accountSid, authToken);

  try {
    const sms = await client.messages.create({
      body: message,
      from,
      to,
    });
    return NextResponse.json({ success: true, sid: sms.sid });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
