"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { User } from "@supabase/supabase-js";
import { Avatar } from "../../../components/ui/avatar";
import { UserRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

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
        <Button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
          className="mt-8 w-full bg-red-500 hover:bg-red-600 text-white"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
    </main>
  );
}
