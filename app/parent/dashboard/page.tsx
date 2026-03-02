"use client";

import { useEffect, useState } from "react";
// Type for linked students
type LinkedStudent = {
  student_id: string;
  profiles?: {
    full_name?: string;
    id: string;
  };
};
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { User } from "@supabase/supabase-js";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function ParentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const router = useRouter();

  // Move fetchLinkedStudents above useEffect
  async function fetchLinkedStudents(parentId: string) {
    const { data } = await supabase
      .from("parent_students")
      .select(
        "student_id, profiles!parent_students_student_id_fkey(full_name, id)",
      )
      .eq("parent_id", parentId);
    if (data) {
      // Map profiles from array to object
      type SupabaseLinkedStudent = {
        student_id: string;
        profiles:
          | { full_name?: string; id: string }[]
          | { full_name?: string; id: string };
      };
      const mapped = (data as SupabaseLinkedStudent[]).map((item) => ({
        ...item,
        profiles: Array.isArray(item.profiles)
          ? item.profiles[0]
          : item.profiles,
      }));
      setLinkedStudents(mapped as LinkedStudent[]);
    }
  }

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      // Check if user is a parent
      if (data.user.user_metadata?.role !== "parent") {
        router.replace("/student/dashboard");
        return;
      }
      setUser(data.user);
      await fetchLinkedStudents(data.user.id);
      setLoading(false);
    }
    fetchUser();
  }, [router]);

  // Use the type from @yudiel/react-qr-scanner if available, otherwise use unknown and narrow
  async function handleScan(result: unknown) {
    // The scanner returns an array of objects with rawValue
    if (!Array.isArray(result) || !result[0]?.rawValue) return;
    const studentId = result[0].rawValue as string;
    setScanning(false);
    setLinkStatus("Linking...");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      setLinkStatus("You must be logged in.");
      return;
    }

    const res = await fetch("/api/link-parent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ studentId }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setLinkStatus("Successfully linked to student!");
      if (user) await fetchLinkedStudents(user.id);
    } else {
      setLinkStatus(data.error || "Failed to link.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-gray-700 text-xl">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <main className="flex flex-1 flex-col items-center py-8 px-4">
        <Card className="w-full max-w-md p-8 flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Parent Dashboard
          </h1>
          <p className="text-gray-600 mb-4 text-center">
            Scan your child&apos;s QR code to link your accounts.
          </p>
          {!scanning && (
            <Button className="w-full mb-4" onClick={() => setScanning(true)}>
              Scan QR Code
            </Button>
          )}
          {scanning && (
            <div className="w-full mb-4">
              <Scanner onScan={handleScan} />
              <Button
                className="w-full mt-2"
                variant="outline"
                onClick={() => setScanning(false)}
              >
                Cancel
              </Button>
            </div>
          )}
          {linkStatus && (
            <p className="mt-4 text-center text-sm text-gray-700">
              {linkStatus}
            </p>
          )}
        </Card>

        <Card className="w-full max-w-md p-8">
          <h2 className="text-xl font-bold mb-4">Linked Students</h2>
          {linkedStudents.length === 0 ? (
            <p className="text-gray-500">No students linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {linkedStudents.map((link) => (
                <li key={link.student_id} className="p-2 bg-gray-100 rounded">
                  {link.profiles?.full_name || link.student_id}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </>
  );
}
