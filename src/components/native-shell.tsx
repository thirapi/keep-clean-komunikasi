"use client";

import dynamic from "next/dynamic";

/**
 * The native shell is client-only and must never be part of the server render
 * or the initial browser bundle. `next/dynamic` with ssr:false keeps the whole
 * component, and the Capacitor plugin imports it pulls in, in a separate chunk
 * that is only fetched by the native app.
 */
export const NativeShell = dynamic(
  () => import("./native-shell-impl").then((m) => m.NativeShell),
  { ssr: false },
);
