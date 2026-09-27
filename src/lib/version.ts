import pkg from "../../package.json";

/**
 * Single source of truth for the application version.
 *
 * Read from package.json so the web app, the native shells and the release
 * notes cannot drift apart. The Android build reads the same field through
 * android/app/build.gradle, which is what keeps versionCode and the settings
 * screen from disagreeing after a release.
 */
export const APP_VERSION = pkg.version as string;

/**
 * Monotonic integer derived from the semver, used as the Android versionCode
 * and iOS CURRENT_PROJECT_VERSION.
 *
 * Play Store rejects an upload whose versionCode has not increased, so this
 * cannot be hand-maintained — it is computed. major*10000 + minor*100 + patch
 * gives 99 releases per minor and 9999 majors of headroom, which is far more
 * than this project will ever ship.
 */
export function parseVersionCode(version: string): number {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) return 1;
  const [, major, minor, patch] = match;
  return Number(major) * 10000 + Number(minor) * 100 + Number(patch);
}

export const APP_VERSION_CODE = parseVersionCode(APP_VERSION);
