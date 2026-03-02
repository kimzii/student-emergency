"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        // User is logged in, redirect based on role
        const { data: userData } = await supabase.auth.getUser();
        const role = userData?.user?.user_metadata?.role;
        if (role === "parent") {
          router.replace("/parent/dashboard");
        } else {
          router.replace("/student/dashboard");
        }
      } else {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-white text-xl">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center font-sans"
      style={{
        background:
          "linear-gradient(to bottom, var(--customRed), var(--customPink))",
      }}
    >
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-10 sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-3xl text-start text-white font-semibold">
            Your safety, connected to the people who matter most.
          </h1>
          <p className="text-white text-start">
            SafeLink helps students quickly alert their parents in case of an
            emergency. With just one tap, your location is securely shared and a
            notification is sent — so help can reach you faster.
          </p>
          <div className="flex flex-col w-full gap-4 mt-4">
            <Link
              href="/login"
              className="px-6 py-2 bg-white text-center text-customRed rounded-sm"
              style={{ color: "var(--customRed)" }}
            >
              Start
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
