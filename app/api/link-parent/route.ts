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

  // Verify user (parent)
  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check that the user is a parent
  const parentId = userData.user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", parentId)
    .single();

  if (!profile || profile.role !== "parent") {
    return NextResponse.json(
      { error: "Only parents can link to students." },
      { status: 403 },
    );
  }

  // Get student ID from request body
  const { studentId } = await req.json();
  if (!studentId) {
    return NextResponse.json(
      { error: "Student ID is required." },
      { status: 400 },
    );
  }

  // Check that the student exists and has role 'student'
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", studentId)
    .single();

  if (!studentProfile || studentProfile.role !== "student") {
    return NextResponse.json({ error: "Invalid student ID." }, { status: 404 });
  }

  // Check if link already exists
  const { data: existingLink } = await supabase
    .from("parent_students")
    .select("*")
    .eq("parent_id", parentId)
    .eq("student_id", studentId)
    .single();

  if (existingLink) {
    return NextResponse.json(
      { error: "Already linked to this student." },
      { status: 400 },
    );
  }

  // Insert into parent_students
  const { error: insertError } = await supabase.from("parent_students").insert({
    parent_id: parentId,
    student_id: studentId,
  });

  if (insertError) {
    console.error("Link parent error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Successfully linked to student!",
  });
}
