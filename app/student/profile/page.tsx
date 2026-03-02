"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Card } from "../../../components/ui/card";
import { User } from "@supabase/supabase-js";
import { Avatar } from "../../../components/ui/avatar";
import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
        <Avatar
          className="mb-4"
          fallback={<UserRound className="w-10 h-10 text-gray-400" />}
        />
        <h1 className="text-2xl font-bold mb-6 text-center">Profile</h1>
        <div className="mb-4 w-full">
          <span className="block text-gray-600 font-medium">Full Name:</span>
          <span className="block text-gray-900 text-lg">
            {user?.user_metadata?.full_name || "-"}
          </span>
        </div>
        <div className="mb-4 w-full">
          <span className="block text-gray-600 font-medium">Email:</span>
          <span className="block text-gray-900 text-lg">{user?.email}</span>
        </div>
        <div className="mb-4 w-full">
          <span className="block text-gray-600 font-medium">Role:</span>
          <span className="block text-gray-900 text-lg capitalize">
            {user?.user_metadata?.role || "-"}
          </span>
        </div>
        <div className="mt-6 flex flex-col items-center w-full">
          <span className="block text-gray-600 font-medium mb-2">
            Link Parent
          </span>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Your parent can scan this QR code to link their account with yours.
          </p>
          <div className="bg-white p-4 rounded-lg border">
            <QRCode value={user?.id || ""} size={160} />
          </div>
        </div>
      </Card>
    </main>
  );
}
