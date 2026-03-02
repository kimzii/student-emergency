"use client";
import ParentBottomNav from "../components/ParentBottomNav";
import AppHeader from "../components/AppHeader";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col bg-white font-sans"
      style={{
        backgroundImage: "url(/mapbg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <span className="absolute inset-0 bg-white opacity-96 pointer-events-none z-0" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader></AppHeader>
        <div className="flex-1 flex flex-col pb-16">{children}</div>
        <ParentBottomNav />
      </div>
    </div>
  );
}
