"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { QrCode, X } from "lucide-react";
import QRCode from "react-qr-code";

export default function LinkedParentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  type LinkedParent = {
    parent_id: string;
    profiles?: {
      full_name?: string;
      id: string;
    };
  };
  const [linkedParents, setLinkedParents] = useState<LinkedParent[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserAndParents() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      // Fetch linked parents
      const { data: parentLinks } = await supabase
        .from("parent_students")
        .select(
          "parent_id, profiles!parent_students_parent_id_fkey(full_name, id)",
        )
        .eq("student_id", data.user.id);
      if (parentLinks && Array.isArray(parentLinks)) {
        // Map profiles from array to object
        const mapped: LinkedParent[] = parentLinks.map((item) => ({
          ...item,
          profiles: Array.isArray(item.profiles)
            ? item.profiles[0]
            : item.profiles,
        }));
        setLinkedParents(mapped);
      }
      setLoading(false);
    }
    fetchUserAndParents();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-gray-700 text-xl">Loading...</span>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center py-8 px-4">
      <Card className="w-full max-w-md p-8 flex flex-col items-center shadow-xl rounded-2xl border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">
          Linked Parents
        </h1>
        {linkedParents.length === 0 ? (
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
            <p className="text-gray-500 text-lg">No parents linked yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 w-full mb-6">
            {linkedParents.map((link) => (
              <li key={link.parent_id} className="flex items-center gap-3 py-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-500"
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
                <span className="font-semibold text-lg text-gray-800">
                  {link.profiles?.full_name || link.parent_id}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-2 mt-2"
          variant={showQR ? "outline" : "default"}
        >
          {showQR ? (
            <>
              <X className="w-5 h-5" />
              Hide QR Code
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              Show Link QR Code
            </>
          )}
        </Button>

        {showQR && (
          <div className="mt-6 flex flex-col items-center w-full">
            <p className="text-sm text-gray-500 mb-4 text-center">
              Your parent can scan this QR code to link their account with
              yours.
            </p>
            <div className="bg-white p-4 rounded-lg border">
              <QRCode value={user?.id || ""} size={160} />
            </div>
            <p className="text-xs text-gray-400 mt-2">ID: {user?.id}</p>
          </div>
        )}
      </Card>
    </main>
  );
}
