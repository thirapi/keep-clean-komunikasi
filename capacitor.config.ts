import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

/**
 * The app is served from the live Next.js deployment rather than a local
 * bundle.
 *
 * `output: "export"` is not an option here: the app exposes 52 Server Actions
 * across 12 `"use server"` modules, and Server Actions are only callable from
 * inside a running Next.js server. A static export would strip the entire data
 * layer. Pointing the WebView at the deployment keeps the backend unchanged and
 * every action working.
 */
const APP_URL =
  process.env.CAPACITOR_APP_URL ?? "https://komunikasi.qzz.io";

const config: CapacitorConfig = {
  appId: "qzz.io.komunikasi",
  appName: "Komunikasi",

  // No local bundle: the WebView loads the live site.
  server: {
    url: APP_URL,
    // Never allow plain http, otherwise the WebView loses a secure context and
    // IndexedDB, WebCrypto and service workers break.
    cleartext: false,
    // Treat the origin as https so the app looks first-party to the browser APIs.
    androidScheme: "https",
  },

  // Web content must stay live; never let the native shell cache a stale build.
  android: {
    allowMixedContent: false,
  },

  ios: {
    contentInset: "always",
    // Let the JS control the scroll view so the chat list keeps its own layout.
    scrollEnabled: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DEFAULT",
      backgroundColor: "#0a0a0a",
    },
    Keyboard: {
      // The chat input sits at the bottom of the viewport; without this the
      // WebView gets covered by the keyboard on Android.
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
