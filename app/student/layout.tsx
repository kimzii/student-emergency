"use client";
import StudentBottomNav from "../components/StudentBottomNav";
import AppHeader from "../components/AppHeader";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <AppHeader></AppHeader>
      <div className="flex-1 flex flex-col pb-16">{children}</div>
      <StudentBottomNav />
    </div>
  );
}
