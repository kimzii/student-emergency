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
      <Card className="w-full max-w-md p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center">Linked Parents</h1>
        {linkedParents.length === 0 ? (
          <p className="text-gray-600 mb-6">No parents linked yet.</p>
        ) : (
          <div className="w-full mb-6">
            <h2 className="text-lg font-semibold mb-2 text-center">
              Your Linked Parents
            </h2>
            <ul className="space-y-2">
              {linkedParents.map((link) => (
                <li
                  key={link.parent_id}
                  className="p-2 bg-gray-100 rounded text-center"
                >
                  {link.profiles?.full_name || link.parent_id}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-2"
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
