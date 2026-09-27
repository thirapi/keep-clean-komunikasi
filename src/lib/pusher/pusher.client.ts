"use client";

import PusherClient from "pusher-js";

/**
 * The Pusher browser client must never be constructed on the server.
 *
 * This module is reachable from server components transitively
 * (app-sidebar -> nav-main-direct-message -> presence-provider), and pusher-js'
 * ESM default export has no server-side interop, so constructing it at module
 * scope made any route that rendered the sidebar after auth fail with
 * "pusher.js.default is not a constructor" — a 500 on /settings.
 *
 * Construction is therefore deferred to first use, which only ever happens in
 * the browser: every caller is a client component effect or event handler.
 */
let instance: PusherClient | null = null;

export function getPusher(): PusherClient {
  if (instance === null) {
    instance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
      authEndpoint: "/api/pusher",
    });
  }
  return instance;
}
