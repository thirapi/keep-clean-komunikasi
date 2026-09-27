"use client";

import { isNative } from "@/lib/native/platform";

/**
 * Haptic feedback.
 *
 * The plugin is imported dynamically so its code lands in a separate chunk that
 * a browser never fetches. Every call no-ops on the web, so callers never need
 * to branch, and each one is fire-and-forget: haptics must never interrupt
 * message delivery.
 */
function fire(kind: "impact" | "notification", style: string) {
  if (!isNative()) return;
  void (async () => {
    const { Haptics, ImpactStyle, NotificationType } = await import(
      "@capacitor/haptics"
    );
    if (kind === "impact") {
      await Haptics.impact({ style: ImpactStyle[style as keyof typeof ImpactStyle] });
    } else {
      await Haptics.notification({
        type: NotificationType[style as keyof typeof NotificationType],
      });
    }
  })().catch(() => {
    /* device without a vibrator, or permission denied */
  });
}

export const hapticLight = () => fire("impact", "Light");
export const hapticMedium = () => fire("impact", "Medium");
export const hapticHeavy = () => fire("impact", "Heavy");

export const hapticSuccess = () => fire("notification", "Success");
export const hapticWarning = () => fire("notification", "Warning");
export const hapticError = () => fire("notification", "Error");
