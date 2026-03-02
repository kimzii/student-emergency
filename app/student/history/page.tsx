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

export default function StudentHistoryPage() {
  const [events, setEvents] = useState<any[]>([]);
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
        .order("created_at", { ascending: false });
      setEvents(data || []);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center py-8 px-4">
      <Card className="w-full max-w-2xl p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center">Emergency History</h1>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-600">No emergency events found.</p>
        ) : (
          <Table>
            <TableCaption>Your emergency history</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    {new Date(event.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{event.status}</TableCell>
                  <TableCell>{event.location_name || "Unknown location"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </main>
  );
}