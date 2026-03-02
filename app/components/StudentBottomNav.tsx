"use client";
import { useRouter, usePathname } from "next/navigation";
import { User, Home, History, Link2 } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function StudentBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname.includes(path);

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around items-center py-2 z-30 h-20">
      <Button
        variant="ghost"
        className={
          isActive("/student/dashboard") ? "text-destructive" : "text-gray-500"
        }
        onClick={() => router.push("/student/dashboard")}
      >
        <Home className="w-10 h-10" />
      </Button>
      <Button
        variant="ghost"
        className={
          isActive("/student/history") ? "text-destructive" : "text-gray-500"
        }
        onClick={() => router.push("/student/history")}
      >
        <History className="w-10 h-10" />
      </Button>
      <Button
        variant="ghost"
        className={
          isActive("/student/linked-parents")
            ? "text-destructive"
            : "text-gray-500"
        }
        onClick={() => router.push("/student/linked-parents")}
      >
        <Link2 className="w-10 h-10" />
      </Button>
      <Button
        variant="ghost"
        className={
          isActive("/student/profile") ? "text-destructive" : "text-gray-500"
        }
        onClick={() => router.push("/student/profile")}
      >
        <User className="w-10 h-10" />
      </Button>
    </nav>
  );
}
