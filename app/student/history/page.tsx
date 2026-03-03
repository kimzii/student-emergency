"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Card } from "../../../components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../../../components/ui/table";

type EmergencyEvent = {
  id: string;
  status: string;
  created_at: string;
  location_name?: string;
};

export default function StudentHistoryPage() {
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const studentId = userData?.user?.id;
      if (!studentId) {
        setEvents([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("emergency_events")
        .select("id, status, created_at, location_name")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(5);
      setEvents((data as EmergencyEvent[]) || []);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center pt-20 pb-24 px-4">
      <Card className="w-full max-w-2xl p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Emergency History
        </h1>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-600">No emergency events found.</p>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className="w-full p-4 flex flex-col gap-2 bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg text-destructive">
                    {event.status.charAt(0).toUpperCase() +
                      event.status.slice(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {event.location_name || "Unknown location"}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
