import * as React from "react"

const MOBILE_BREAKPOINT = 768

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

type Subscriber = () => void

let mediaQueryList: MediaQueryList | null = null
const subscribers = new Set<Subscriber>()

function getMediaQueryList() {
  if (mediaQueryList === null) {
    mediaQueryList = window.matchMedia(MOBILE_QUERY)
    mediaQueryList.addEventListener("change", notifySubscribers)
  }
  return mediaQueryList
}

function notifySubscribers() {
  for (const subscriber of subscribers) subscriber()
}

function subscribe(subscriber: Subscriber) {
  getMediaQueryList()
  subscribers.add(subscriber)
  return () => {
    subscribers.delete(subscriber)
  }
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return null
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
