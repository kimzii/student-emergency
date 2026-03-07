"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "../../components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

// Check if push notifications are supported (runs only on client)
function checkPushSupport() {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window;
}

// Helper function to convert VAPID key (moved outside component for reuse)
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function saveSubscriptionToBackend(subscription: PushSubscription) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const res = await fetch("/api/push-subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  return res.ok;
}

export default function PushNotificationSubscriber() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported] = useState(() => checkPushSupport());
  const [permissionState, setPermissionState] =
    useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupported) return;

    async function initPush() {
      try {
        const permission = Notification.permission;
        setPermissionState(permission);
        console.log("[PushSubscriber] Notification permission:", permission);

        const registration = await navigator.serviceWorker.ready;
        const existingSubscription =
          await registration.pushManager.getSubscription();
        console.log(
          "[PushSubscriber] Existing subscription:",
          existingSubscription,
        );

        if (existingSubscription) {
          // Already subscribed — make sure token is saved in DB
          console.log(
            "[PushSubscriber] Already subscribed, ensuring token is saved...",
          );
          await saveSubscriptionToBackend(existingSubscription);
          setIsSubscribed(true);
          return;
        }

        // If permission already granted, auto-subscribe silently (no button needed)
        if (permission === "granted") {
          console.log(
            "[PushSubscriber] Permission already granted, auto-subscribing...",
          );
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) return;

          const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });

          const saved = await saveSubscriptionToBackend(newSubscription);
          console.log("[PushSubscriber] Auto-subscribed and saved:", saved);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error("[PushSubscriber] Error initializing push:", error);
      }
    }

    initPush();
  }, [isSupported]);

  async function subscribeToPush() {
    setLoading(true);
    try {
      console.log("[PushSubscriber] Requesting notification permission...");
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      console.log("[PushSubscriber] Permission result:", permission);
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        toast.error("Push notifications not configured");
        setLoading(false);
        return;
      }

      // Unsubscribe any stale subscription first
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log(
        "[PushSubscriber] Subscription created:",
        JSON.stringify(subscription.toJSON()),
      );

      const saved = await saveSubscriptionToBackend(subscription);
      if (saved) {
        setIsSubscribed(true);
        toast.success("Push notifications enabled!");
      } else {
        toast.error("Failed to save subscription");
      }
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast.error("Failed to enable push notifications");
    }
    setLoading(false);
  }

  async function unsubscribeFromPush() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        await fetch("/api/push-subscribe", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setIsSubscribed(false);
        toast.success("Push notifications disabled");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Failed to disable push notifications");
    }
    setLoading(false);
  }

  if (!isSupported) return null;

  // If permission denied, show nothing (user must enable in browser settings)
  if (permissionState === "denied") return null;

  // If subscribed, show option to disable
  if (isSubscribed) {
    return (
      <Button
        onClick={unsubscribeFromPush}
        disabled={loading}
        variant="outline"
        className="flex items-center gap-2"
      >
        <BellOff className="w-4 h-4" />
        Disable Notifications
      </Button>
    );
  }

  // If permission not yet granted, show button to enable
  return (
    <Button
      onClick={subscribeToPush}
      disabled={loading}
      variant="default"
      className="flex items-center gap-2"
    >
      <Bell className="w-4 h-4" />
      Enable Notifications
    </Button>
  );
}
