"use client";
import { useRouter, usePathname } from "next/navigation";
import { User, Home, History, Link2 } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function StudentBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname.includes(path);

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around items-center py-2 z-30">
      <Button
        variant="ghost"
        className={
          isActive("/student/dashboard") ? "text-blue-600" : "text-gray-500"
        }
        onClick={() => router.push("/student/dashboard")}
      >
        <Home className="w-6 h-6" />
        <span className="text-xs">Home</span>
      </Button>
      <Button
        variant="ghost"
        className={
          isActive("/student/history") ? "text-blue-600" : "text-gray-500"
        }
        onClick={() => router.push("/student/history")}
      >
        <History className="w-6 h-6" />
        <span className="text-xs">History</span>
      </Button>
      <Button
        variant="ghost"
        className={
          isActive("/student/profile") ? "text-blue-600" : "text-gray-500"
        }
        onClick={() => router.push("/student/profile")}
      >
        <User className="w-6 h-6" />
        <span className="text-xs">Profile</span>
      </Button>
      <Button
        variant="ghost"
        className={
          isActive("/student/linked-parents")
            ? "text-blue-600"
            : "text-gray-500"
        }
        onClick={() => router.push("/student/linked-parents")}
      >
        <Link2 className="w-6 h-6" />
        <span className="text-xs">Parents</span>
      </Button>
    </nav>
  );
}
