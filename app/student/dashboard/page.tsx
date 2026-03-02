"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import EmergencyButton from "../../EmergencyButton";
import { User } from "@supabase/supabase-js";

type MeApiResponse = { user: User | null };

export default function StudentDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        router.replace("/login");
        return;
      }
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result: MeApiResponse = await res.json();
      if (!res.ok || !result.user) {
        router.replace("/login");
      } else {
        setUser(result.user);
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-white text-xl">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 w-full text-start pt-16 px-10">
        <h2 className="text-xl text-gray-700 font-medium">
          {user?.user_metadata?.full_name
            ? `Welcome, ${user.user_metadata.full_name}!`
            : "Welcome!"}
        </h2>
      </div>
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center px-10 mx-auto">
        <h1 className="text-3xl text-gray-900 font-semibold mb-6">
          Are you in Emergency?
        </h1>
        <p className="text-gray-700 mb-8 text-center">
          Press the button below to send an emergency alert with your current
          location to your linked parents.
        </p>
        <EmergencyButton />
      </main>
    </>
  );
}
