import { useSyncExternalStore } from "react";

/**
 * Browser storage is an external system as far as React is concerned, so
 * components read it through `useSyncExternalStore` instead of copying it
 * into state from an effect. Writers call `notifyStorage()` so readers in
 * the same tab re-read; the `storage` event covers other tabs.
 */
const STORAGE_EVENT = "blindpay:storage";

export function notifyStorage() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STORAGE_EVENT));
}

function subscribeStorage(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const noSubscribe = () => () => {};

/** A value read from storage; `serverValue` stands in until hydration. */
export function useStorageValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(subscribeStorage, read, () => serverValue);
}

/** A browser-only constant such as `location.origin`. */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noSubscribe, read, () => serverValue);
}

function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

/** The URL fragment, or `undefined` before the browser has a say. */
export function useHash(): string | undefined {
  return useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => undefined,
  );
}
