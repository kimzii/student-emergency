"use client";
import ParentBottomNav from "../components/ParentBottomNav";
import AppHeader from "../components/AppHeader";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <AppHeader></AppHeader>
      <div className="flex-1 flex flex-col pb-16">{children}</div>
      <ParentBottomNav />
    </div>
  );
}
