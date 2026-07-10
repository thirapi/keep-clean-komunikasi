import { UAParser } from "ua-parser-js";

export interface DeviceInfo {
  deviceType: string;
  os: string;
  browser: string;
  model?: string;
}

export function parseDeviceInfo(userAgent: string): DeviceInfo {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  let deviceType = "desktop";
  if (device.type === "mobile") deviceType = "mobile";
  else if (device.type === "tablet") deviceType = "tablet";

  const osName = os.name || "Unknown OS";
  const osVersion = os.version ? ` ${os.version}` : "";
  const browserName = browser.name || "Unknown";
  const browserVersion = browser.version ? ` ${browser.version}` : "";

  return {
    deviceType,
    os: `${osName}${osVersion}`,
    browser: `${browserName}${browserVersion}`,
    model: device.model || undefined,
  };
}
