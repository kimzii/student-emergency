"use client";
import { useRouter, usePathname } from "next/navigation";
import { Home, User, Link2 } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function ParentBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname.includes(path);

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around items-center py-2 z-30 rounded">
      <Button
        variant="ghost"
        className={
          isActive("/parent/dashboard") ? "text-destructive" : "text-gray-500"
        }
        onClick={() => router.push("/parent/dashboard")}
      >
        <Home className="w-6 h-6" />
        <span className="text-xs">Home</span>
      </Button>
      <Button
        variant="ghost"
        className={
          isActive("/parent/profile") ? "text-destructive" : "text-gray-500"
        }
        onClick={() => router.push("/parent/profile")}
      >
        <User className="w-6 h-6" />
        <span className="text-xs">Profile</span>
      </Button>
      <Button
        variant="ghost"
        className={
          isActive("/parent/linked-students")
            ? "text-destructive"
            : "text-gray-500"
        }
        onClick={() => router.push("/parent/linked-students")}
      >
        <Link2 className="w-6 h-6" />
        <span className="text-xs">Students</span>
      </Button>
    </nav>
  );
}
