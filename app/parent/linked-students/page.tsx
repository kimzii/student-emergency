"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Card } from "../../../components/ui/card";

type LinkedStudent = {
  student_id: string;
  profiles?: {
    full_name?: string;
    email?: string;
    id: string;
  };
};

export default function LinkedStudentsPage() {
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLinkedStudents() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const parentId = userData?.user?.id;
      if (!parentId) {
        setLinkedStudents([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("parent_students")
        .select("student_id, profiles:student_id(full_name, id)")
        .eq("parent_id", parentId);
      if (data) {
        // Map profiles from array to object
        type SupabaseLinkedStudent = {
          student_id: string;
          profiles:
            | { full_name?: string; email?: string; id: string }[]
            | { full_name?: string; email?: string; id: string };
        };
        const mapped = (data as SupabaseLinkedStudent[]).map((item) => ({
          ...item,
          profiles: Array.isArray(item.profiles)
            ? item.profiles[0]
            : item.profiles,
        }));
        setLinkedStudents(mapped as LinkedStudent[]);
      }
      setLoading(false);
    }
    fetchLinkedStudents();
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center py-8 px-4">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-l font-bold mb-4 text-start">Linked Students</h2>
        {linkedStudents.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5v-2a4 4 0 00-3-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg">No students linked yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 w-full">
            {linkedStudents.map((link) => (
              <li
                key={link.student_id}
                className="flex items-center gap-3 py-4"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.657 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-gray-800">
                  {link.profiles?.full_name || link.student_id}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
