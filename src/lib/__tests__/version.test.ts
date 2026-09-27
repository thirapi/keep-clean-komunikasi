import { describe, expect, it } from "vitest";
import pkg from "../../../package.json";
import { APP_VERSION, APP_VERSION_CODE, parseVersionCode } from "../version";

describe("version", () => {
  it("matches package.json", () => {
    expect(APP_VERSION).toBe(pkg.version);
  });

  it("is a complete semver, because the Android build derives versionCode from it", () => {
    // android/app/build.gradle throws when this is not major.minor.patch.
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("derives a monotonic versionCode", () => {
    expect(parseVersionCode("1.0.0")).toBe(10000);
    expect(parseVersionCode("1.0.1")).toBe(10001);
    expect(parseVersionCode("1.2.3")).toBe(10203);
    expect(parseVersionCode("2.0.0")).toBe(20000);
  });

  it("never repeats, so a Play Store upload is never rejected for a stale versionCode", () => {
    const ordered = ["0.1.0", "0.1.1", "1.0.0", "1.0.1", "1.1.0", "2.0.0"];
    const codes = ordered.map(parseVersionCode);
    for (let i = 1; i < codes.length; i++) {
      expect(codes[i]).toBeGreaterThan(codes[i - 1]);
    }
  });

  it("falls back to 1 on unparseable input rather than throwing in the UI", () => {
    expect(parseVersionCode("not-a-version")).toBe(1);
  });

  it("agrees with the version the app displays", () => {
    expect(APP_VERSION_CODE).toBe(parseVersionCode(APP_VERSION));
  });
});
