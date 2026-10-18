"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, MINUTE);
  return () => window.clearInterval(id);
}

// Rounded to the minute so the snapshot stays stable between renders.
const getSnapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const getServerSnapshot = () => null;

/** Current time (ms, minute precision), ticking every minute. Null during SSR and hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
