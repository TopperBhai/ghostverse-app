"use client";

import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { app, initMessaging } from "../../lib/firebase-client";
import { useAuth } from "../../custom-hooks/use-auth";
import { Bell, BellOff, Loader2 } from "lucide-react";

export function PushNotificationManager() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      
      // Setup message listener if already granted
      if (Notification.permission === "granted") {
        setupMessageListener();
      }
    } else {
      setIsSupported(false);
    }
  }, []);

  const setupMessageListener = async () => {
    const messaging = await initMessaging();
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("Message received in foreground:", payload);
        // We can optionally show a custom toast here if we want,
        // but system notification is usually better.
        // Actually, foreground messages don't automatically show a system notification
        // unless we explicitly create one:
        if (payload.notification) {
          new Notification(payload.notification.title || "GhostVerse", {
            body: payload.notification.body,
            icon: payload.notification.image || "/icons/icon-192x192.png",
          });
        }
      });
    } else {
      setIsSupported(false);
    }
  };

  const requestPermission = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === "granted") {
        const messaging = await initMessaging();
        if (messaging) {
          // Replace this VAPID_KEY with the one from Firebase Console
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            throw new Error("VAPID key is missing in environment variables.");
          }

          const currentToken = await getToken(messaging, { vapidKey });
          
          if (currentToken) {
            // Send token to our server
            await fetch("/api/notifications/device", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: currentToken, action: "register" }),
            });
            
            setupMessageListener();
          } else {
            setError("Failed to generate registration token.");
          }
        }
      } else {
        setError("Notification permission was denied.");
      }
    } catch (err: any) {
      console.error("Error requesting notification permission:", err);
      setError(err.message || "Failed to setup notifications");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported || !user) return null;
  if (permission === "granted") return null; // Don't show if already granted

  return (
    <div className="bg-ghost-900 border border-phantom-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-lg mb-6">
      <div className="flex-1">
        <h3 className="text-ghost-100 font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-phantom-400" />
          Enable Push Notifications
        </h3>
        <p className="text-sm text-ghost-400 mt-1">
          Get notified when someone sends you a message, replies to your Haunt, or mentions you.
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <button
        onClick={requestPermission}
        disabled={loading || permission === "denied"}
        className={`px-4 py-2 rounded-lg font-bold flex items-center justify-center min-w-[120px] transition-all ${
          permission === "denied" 
            ? "bg-ghost-800 text-ghost-500 cursor-not-allowed"
            : "bg-phantom-500 text-white hover:bg-phantom-600 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-95"
        }`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : permission === "denied" ? (
          <><BellOff className="w-4 h-4 mr-2" /> Blocked</>
        ) : (
          "Allow"
        )}
      </button>
    </div>
  );
}
