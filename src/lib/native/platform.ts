"use client";

/**
 * Native platform detection without pulling the Capacitor runtime into the
 * web bundle.
 *
 * Importing `@capacitor/core` eagerly cost ~55 KB of initial JS on every route,
 * including plain browser visits that can never use a native plugin. Detection
 * therefore reads the globals the native shell injects, which is all the
 * boolean actually needs, and the plugin modules themselves are imported
 * dynamically by the callers that are already gated on isNative().
 */

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

const CAPACITOR_GLOBAL = "__CAPACITOR__";

function cap(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as Record<string, CapacitorGlobal | undefined>)[CAPACITOR_GLOBAL];
}

/** True only inside the Capacitor native shell. */
export const isNative = (): boolean => {
  const c = cap();
  if (!c) return false;
  try {
    // The bridge only exists in the shell; in a browser this is a no-op
    // polyfill that reports false.
    if (c.isNativePlatform) return c.isNativePlatform() === true;
    return false;
  } catch {
    return false;
  }
};

export const platform = (): "ios" | "android" | "web" => {
  const c = cap();
  if (!c) return "web";
  try {
    const p = c.getPlatform?.();
    return p === "ios" || p === "android" ? p : "web";
  } catch {
    return "web";
  }
};
