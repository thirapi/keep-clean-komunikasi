"use client";

import { useEffect } from "react";
import { savePushSubscriptionAction } from "@/app/push.action";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });

    await savePushSubscriptionAction(JSON.parse(JSON.stringify(subscription)));
    console.log("Subscribed to push notifications");
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registered with scope:", registration.scope);
          
          if ("pushManager" in registration) {
            await subscribeToPushNotifications(registration);
          }
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      };

      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register);
        return () => window.removeEventListener("load", register);
      }
    }
  }, []);

  return null;
}
