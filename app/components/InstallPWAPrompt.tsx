"use client";

import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { X, Share, PlusSquare } from "lucide-react";

// Helper functions to check environment (run on client only)
function checkIsIOS() {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function checkIsStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function checkShouldShowPrompt() {
  if (typeof window === "undefined") return false;

  const isIOSDevice = checkIsIOS();
  const isInStandaloneMode = checkIsStandalone();

  if (!isIOSDevice || isInStandaloneMode) return false;

  // Check if user has dismissed before (within last 7 days)
  const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
  if (dismissedAt) {
    const dismissedDate = new Date(dismissedAt);
    const daysSinceDismissed =
      (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      return false;
    }
  }
  return true;
}

export default function InstallPWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Delay check to next tick to avoid synchronous setState warning
    const timer = setTimeout(() => {
      if (checkShouldShowPrompt()) {
        setShowPrompt(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  function handleDismiss() {
    localStorage.setItem("pwa-prompt-dismissed", new Date().toISOString());
    setShowPrompt(false);
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 mb-4 relative animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-3 text-center">
          Install SafeLink App
        </h2>

        <p className="text-gray-600 text-sm mb-4 text-center">
          Install this app on your iPhone for the best experience and to receive
          emergency notifications.
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-sm">Tap the Share button</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Share className="w-4 h-4" /> at the bottom of Safari
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-sm">
                Tap &quot;Add to Home Screen&quot;
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <PlusSquare className="w-4 h-4" /> scroll down to find it
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-sm">Tap &quot;Add&quot;</p>
              <p className="text-xs text-gray-500">
                The app will appear on your home screen
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleDismiss}
          variant="outline"
          className="w-full mt-4"
        >
          Maybe Later
        </Button>
      </Card>
    </div>
  );
}
