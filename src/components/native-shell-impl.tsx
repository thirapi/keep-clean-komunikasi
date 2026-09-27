"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNative, platform } from "@/lib/native/platform";
import { NativePushRegistration } from "@/components/native-push-registration";

/**
 * Wires the native shell behaviours a browser tab cannot provide.
 *
 * Loaded through native-shell.tsx via next/dynamic, so this file and the
 * Capacitor plugin imports it pulls in stay out of the initial browser bundle.
 * Every branch is gated on isNative().
 */
export function NativeShell() {
  const router = useRouter();

  // App chrome: status bar styling, keyboard behaviour, splash dismissal.
  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;

    (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        // Keep the bar opaque so content is not drawn underneath it.
        await StatusBar.setOverlaysWebView({ overlay: false });
        const apply = () =>
          StatusBar.setStyle({
            style: document.documentElement.classList.contains("dark")
              ? Style.Dark
              : Style.Light,
          });
        await apply();

        // Follow theme changes.
        const observer = new MutationObserver(() => void apply());
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });
        if (cancelled) observer.disconnect();
      } catch {
        /* unavailable on some devices */
      }

      try {
        // The chat input sits at the bottom; the body must resize or the
        // software keyboard covers it on Android.
        const { Keyboard } = await import("@capacitor/keyboard");
        await Keyboard.setAccessoryBarVisible({ isVisible: false });
      } catch {
        /* non-fatal */
      }

      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        if (!cancelled) await SplashScreen.hide();
      } catch {
        /* non-fatal */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Hardware back. Without this the first press leaves the app, which is the
  // most obvious "this is a website" tell on Android.
  useEffect(() => {
    if (!isNative() || platform() !== "android") return;

    let remove: (() => Promise<void>) | undefined;
    let cancelled = false;

    void (async () => {
      const { App } = await import("@capacitor/app");
      const h = await App.addListener(
        "backButton",
        ({ canGoBack }: { canGoBack: boolean }) => {
          if (canGoBack) {
            router.back();
            return;
          }
          // At the root of the stack, exit like any other app would.
          void App.exitApp();
        },
      );
      if (cancelled) void h.remove();
      else remove = () => h.remove();
    })();

    return () => {
      cancelled = true;
      void remove?.();
    };
  }, [router]);

  return <NativePushRegistration />;
}
