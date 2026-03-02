"use client";
import Image from "next/image";

export default function AppHeader() {
  return (
    <header className="w-full bg-white py-4 px-10 shadow border-b flex items-center rounded">
      <Image
        src="/icons/icon-512x512.png"
        alt="SafeLink Icon"
        width={32}
        height={32}
      />
    </header>
  );
}
