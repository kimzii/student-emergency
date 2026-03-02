"use client";
import StudentBottomNav from "../components/StudentBottomNav";
import AppHeader from "../components/AppHeader";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col font-sans"
      style={{
        backgroundImage: "url(/mapbg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <span className="absolute inset-0 bg-white opacity-96 pointer-events-none z-0" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader />
        <div className="flex-1 flex flex-col pb-16 bg-transparent">
          {children}
        </div>
        <StudentBottomNav />
      </div>
    </div>
  );
}
