"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { User } from "@supabase/supabase-js";
import { Avatar } from "../../../components/ui/avatar";
import { UserRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ParentProfilePage() {
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
      <Card className="w-full max-w-md p-8 flex flex-col items-center shadow-xl rounded-2xl border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="mb-2 w-20 h-20 shadow-md ring-2 ring-blue-200">
            <UserRound className="w-12 h-12 text-blue-400" />
          </Avatar>
          <h1 className="text-3xl font-bold mt-2 text-blue-900">
            {user?.user_metadata?.full_name || "-"}
          </h1>
          <span className="text-gray-500 text-sm">Parent Profile</span>
        </div>
        <div className="w-full space-y-4 mb-6">
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium">Email</span>
            <span className="text-gray-900 text-lg truncate">
              {user?.email}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium">Role</span>
            <span className="text-gray-900 text-lg capitalize">
              {user?.user_metadata?.role || "-"}
            </span>
          </div>
        </div>
        <Button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white shadow"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </Card>
    </main>
  );
}
