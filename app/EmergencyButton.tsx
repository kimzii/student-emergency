"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function EmergencyButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get current position using browser Geolocation API
  async function handleEmergency() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    // Get the access token from the current session
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      setError("You must be logged in to send an emergency alert.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Call the backend API to insert emergency event
        const res = await fetch("/api/emergency", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ lat: latitude, lng: longitude }),
        });
        const result = await res.json();
        console.log("Emergency insert result:", result);

        if (!res.ok || result.error) {
          setError(
            (result.error || "Failed to send emergency") +
              " (Check if you are logged in and have a student profile)",
          );
        } else {
          setSuccess(true);
        }
        setLoading(false);
      },
      (err) => {
        setError("Failed to get location: " + err.message);
        setLoading(false);
      },
    );
  }

  return (
    <div className="flex items-center justify-center w-full">
      <div
        className="relative flex items-center justify-center"
        style={{ width: 220, height: 220 }}
      >
        {/* Outer circles for the soft effect */}
        {/* 3 concentric circles only */}
        <span className="absolute w-[200px] h-[200px] rounded-full bg-red-500 opacity-10 animate-pulse" />
        <span className="absolute w-[160px] h-[160px] rounded-full bg-red-500 opacity-20" />
        {/* SOS Button */}
        <button
          className="relative z-10 w-[120px] h-[120px] rounded-full bg-gradient-to-b from-red-500 to-red-400 shadow-lg text-white text-2xl font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleEmergency}
          disabled={loading}
        >
          {loading ? "..." : "SOS"}
        </button>
      </div>
      <div className="flex flex-col items-center mt-4">
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        {success && (
          <div className="text-green-600 text-sm mt-2">SOS sent!</div>
        )}
      </div>
    </div>
  );
}
