"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const checkStatus = async () => {
    setLogs([]);
    addLog("Checking push notification status...");

    // Check service worker
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        addLog(`Service Worker: ${reg.active ? "ACTIVE" : "NOT ACTIVE"}`);
        addLog(`SW Scope: ${reg.scope}`);
      } else {
        addLog("Service Worker: NOT REGISTERED");
      }
    } else {
      addLog("Service Worker: NOT SUPPORTED");
    }

    // Check notification permission
    if ("Notification" in window) {
      addLog(`Notification Permission: ${Notification.permission}`);
    } else {
      addLog("Notifications: NOT SUPPORTED");
    }

    // Check push subscription
    if ("PushManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        addLog(`Push Subscription: ACTIVE`);
        addLog(`Endpoint: ${sub.endpoint.substring(0, 60)}...`);
      } else {
        addLog("Push Subscription: NONE");
      }
    } else {
      addLog("PushManager: NOT SUPPORTED");
    }

    // Fetch server debug info
    try {
      const res = await fetch("/api/test-push");
      const data = await res.json();
      data.logs.forEach((log: string) => addLog(`[Server] ${log}`));
    } catch (err) {
      addLog(
        `Server error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    addLog("Sending test notification...");

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        addLog("ERROR: Not logged in");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/test-push", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      data.logs.forEach((log: string) => addLog(`[Server] ${log}`));
    } catch (err) {
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }

    setLoading(false);
  };

  const resubscribe = async () => {
    setLoading(true);
    addLog("Re-subscribing to push notifications...");

    try {
      // Unsubscribe first
      const reg = await navigator.serviceWorker.ready;
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
        addLog("Unsubscribed from old subscription");
      }

      // Request permission
      const permission = await Notification.requestPermission();
      addLog(`Permission: ${permission}`);

      if (permission !== "granted") {
        addLog("ERROR: Permission denied");
        setLoading(false);
        return;
      }

      // Subscribe
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        addLog("ERROR: VAPID key not configured");
        setLoading(false);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      addLog("New subscription created");
      addLog(`Endpoint: ${sub.endpoint.substring(0, 60)}...`);

      // Save to backend
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const res = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      const data = await res.json();
      addLog(`Backend response: ${JSON.stringify(data)}`);
    } catch (err) {
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }

    setLoading(false);
  };

  const showLocalNotification = async () => {
    setLoading(true);
    addLog("Testing local notification display...");

    try {
      const permission = await Notification.requestPermission();
      addLog(`Permission: ${permission}`);

      if (permission !== "granted") {
        addLog("ERROR: Permission denied");
        setLoading(false);
        return;
      }

      // Try showing notification via service worker
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("🧪 Local Test", {
        body: "This is a local notification test",
        icon: "/icons/icon-192x192.png",
        tag: "test",
      });
      addLog("Local notification triggered via service worker");
    } catch (err) {
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }

    setLoading(false);
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Push Notification Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            User: {user?.email || "Not logged in"}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={checkStatus} disabled={loading}>
              Check Status
            </Button>
            <Button
              onClick={showLocalNotification}
              disabled={loading}
              variant="secondary"
            >
              Test Local Notification
            </Button>
            <Button onClick={resubscribe} disabled={loading} variant="outline">
              Re-subscribe
            </Button>
            <Button
              onClick={sendTestNotification}
              disabled={loading}
              variant="secondary"
            >
              Send Test Notification
            </Button>
          </div>

          <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <span className="text-gray-500">
                Click a button to start debugging...
              </span>
            ) : (
              logs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
