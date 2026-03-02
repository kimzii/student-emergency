"use client";
import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("[App] Service worker registered");
          
          // Check for updates immediately
          registration.update();
          
          // Check for updates every 5 minutes
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);
          
          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New version available, it will activate on next reload
                  console.log("[App] New version available!");
                }
              });
            }
          });
        })
        .catch((err) =>
          console.error("Service worker registration failed:", err)
        );
    }
  }, []);
  return null;
}
