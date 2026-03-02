"use client";
import Navbar from "../components/Navbar";
import ParentBottomNav from "../components/ParentBottomNav";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Navbar />
      <div className="flex-1 flex flex-col pt-16 pb-16">{children}</div>
      <ParentBottomNav />
    </div>
  );
}
