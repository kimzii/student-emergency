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
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      setLoading(false);
    }
    fetchUser();
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
        <p className="text-gray-600 mb-6">No parents linked yet.</p>

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
          </div>
        )}
      </Card>
    </main>
  );
}
