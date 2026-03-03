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
// Type for scanned student info
type ScannedStudent = {
  id: string;
  full_name: string;
  email: string;
};
// Type for emergency events
type EmergencyEvent = {
  id: string;
  student_id: string;
  lat: number;
  lng: number;
  location_name?: string;
  status: string;
  created_at: string;
  student_name?: string;
};
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { User } from "@supabase/supabase-js";
import { Scanner } from "@yudiel/react-qr-scanner";
import PushNotificationSubscriber from "../../components/PushNotificationSubscriber";
import { MapPin, CheckCircle, Siren } from "lucide-react";

export default function ParentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [scannedStudent, setScannedStudent] = useState<ScannedStudent | null>(
    null,
  );
  const [isLinking, setIsLinking] = useState(false);
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyEvent[]>(
    [],
  );
  const [resolvingId, setResolvingId] = useState<string | null>(null);
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

  // Fetch active emergency events for linked students
  async function fetchActiveEmergencies(studentIds: string[]) {
    if (studentIds.length === 0) {
      setActiveEmergencies([]);
      return;
    }
    const { data } = await supabase
      .from("emergency_events")
      .select("id, student_id, lat, lng, location_name, status, created_at")
      .in("student_id", studentIds)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (data) {
      setActiveEmergencies(data as EmergencyEvent[]);
    }
  }

  // Resolve an emergency event
  async function handleResolve(eventId: string) {
    setResolvingId(eventId);
    const { error } = await supabase
      .from("emergency_events")
      .update({ status: "resolved" })
      .eq("id", eventId);
    if (!error && linkedStudents.length > 0) {
      await fetchActiveEmergencies(linkedStudents.map((s) => s.student_id));
    }
    setResolvingId(null);
  }

  // Open Google Maps for navigation
  function openGoogleMaps(lat: number, lng: number) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
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

  // Fetch active emergencies when linked students change
  useEffect(() => {
    if (linkedStudents.length > 0) {
      (async () => {
        await fetchActiveEmergencies(linkedStudents.map((s) => s.student_id));
      })();
    }
  }, [linkedStudents]);

  // Fetch student info after scanning
  async function handleScan(result: unknown) {
    // The scanner returns an array of objects with rawValue
    if (!Array.isArray(result) || !result[0]?.rawValue) return;
    const studentId = (result[0].rawValue as string).trim();
    console.log("Scanned student ID:", studentId);
    console.log("Student ID length:", studentId.length);
    setScanning(false);
    setLinkStatus("Fetching student info...");

    try {
      const res = await fetch(
        `/api/link-parent?studentId=${encodeURIComponent(studentId)}`,
      );
      const data = await res.json();

      if (res.ok) {
        setScannedStudent(data);
        setLinkStatus(null);
      } else {
        console.error("Error response:", data);
        setLinkStatus(data.error || "Failed to fetch student info.");
      }
    } catch {
      setLinkStatus("Error fetching student info.");
    }
  }

  // Link the scanned student to the parent
  async function handleLinkStudent() {
    if (!scannedStudent) return;
    setIsLinking(true);
    setLinkStatus("Linking...");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      setLinkStatus("You must be logged in.");
      setIsLinking(false);
      return;
    }

    try {
      const res = await fetch("/api/link-parent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ studentId: scannedStudent.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLinkStatus("Successfully linked to student!");
        setScannedStudent(null);
        if (user) await fetchLinkedStudents(user.id);
      } else {
        setLinkStatus(data.error || "Failed to link.");
      }
    } catch {
      setLinkStatus("Error linking student.");
    }
    setIsLinking(false);
  }

  // Cancel linking
  function handleCancelLink() {
    setScannedStudent(null);
    setLinkStatus(null);
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
          <div className="mb-4">
            <PushNotificationSubscriber />
          </div>
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
          {scannedStudent && (
            <div className="w-full mb-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Confirm Link</h3>
              <p className="text-gray-700">
                <span className="font-medium">Name:</span>{" "}
                {scannedStudent.full_name || "Unknown"}
              </p>
              {scannedStudent.email && (
                <p className="text-gray-700 mb-4">
                  <span className="font-medium">Email:</span>{" "}
                  {scannedStudent.email}
                </p>
              )}
              {!scannedStudent.email && <div className="mb-4" />}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleLinkStudent}
                  disabled={isLinking}
                >
                  {isLinking ? "Linking..." : "Link"}
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleCancelLink}
                  disabled={isLinking}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {linkStatus && (
            <p className="mt-4 text-center text-sm text-gray-700">
              {linkStatus}
            </p>
          )}
        </Card>

        {/* Active Emergency Events */}
        {activeEmergencies.length > 0 && (
          <Card className="w-full max-w-md p-6 mb-8 border border-destructive bg-destructive/10">
            <h2 className="text-xl font-bold mb-4 text-destructive flex items-center gap-2">
              <Siren className="w-6 h-6 text-destructive" /> Active Emergencies
            </h2>
            <ul className="space-y-4">
              {activeEmergencies.map((event) => {
                const studentName =
                  linkedStudents.find((s) => s.student_id === event.student_id)
                    ?.profiles?.full_name || "Student";
                return (
                  <li
                    key={event.id}
                    className="p-4 border border-destructive rounded-lg bg-destructive/20 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg text-destructive-foreground">
                        {studentName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {event.location_name ||
                        `Lat: ${event.lat}, Lng: ${event.lng}`}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        className="flex-1 flex items-center gap-2 border-primary text-primary"
                        onClick={() => openGoogleMaps(event.lat, event.lng)}
                      >
                        <MapPin className="w-5 h-5 text-primary" />
                        Locate
                      </Button>
                      <Button
                        className="flex-1 flex items-center gap-2 bg-success text-success-foreground hover:bg-success/80"
                        onClick={() => handleResolve(event.id)}
                        disabled={resolvingId === event.id}
                      >
                        <CheckCircle className="w-5 h-5 text-success-foreground" />
                        {resolvingId === event.id ? "Resolving..." : "Resolve"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </main>
    </>
  );
}
