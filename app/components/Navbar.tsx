"use client";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-white border-b shadow-sm fixed top-0 left-0 z-20">
      <span className="text-xl font-bold text-red-600 tracking-wide select-none">
        SafeLink
      </span>
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
