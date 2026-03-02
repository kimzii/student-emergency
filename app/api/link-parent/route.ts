import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET endpoint to fetch student info by ID
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json(
      { error: "Student ID is required." },
      { status: 400 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch student profile from profiles table
  const { data: studentProfile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", studentId)
    .single();

  if (error || !studentProfile) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  if (studentProfile.role !== "student") {
    return NextResponse.json(
      { error: "This is not a student account." },
      { status: 400 },
    );
  }

  // Get email from auth.users using service role key if available, 
  // otherwise return profile data without email
  let email = "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(studentId);
    email = authUser?.user?.email || "";
  }

  return NextResponse.json({
    id: studentProfile.id,
    full_name: studentProfile.full_name,
    email: email,
  });
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
