import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Shared test setup.
 *
 * The Zustand stores read the live viewport via `window.innerWidth/Height`
 * (see `lib/store/windowStore.ts` and `lib/store/desktopStore.ts`). jsdom
 * defaults to 1024x768; we pin a deterministic desktop viewport so geometry is
 * stable across runs. Individual tests can override these per case.
 */
const DEFAULT_VIEWPORT = { width: 1440, height: 900 };

/**
 * In-memory Storage. This jsdom build doesn't expose a usable `localStorage`
 * (its methods are missing), which the Zustand `persist` middleware relies on,
 * so we install a minimal compliant implementation.
 */
function createMemoryStorage(): Storage {
  let map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => {
      map = new Map();
    },
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    key: (index) => Array.from(map.keys())[index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, String(value));
    },
  };
}

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: createMemoryStorage(),
});
// Same story for sessionStorage (boot/logon + welcome-balloon flags).
Object.defineProperty(window, "sessionStorage", {
  configurable: true,
  value: createMemoryStorage(),
});

/*
 * Browser APIs jsdom lacks but Radix (menus, dialogs, tooltips) and Framer
 * Motion touch: matchMedia, ResizeObserver, pointer capture, scrollIntoView.
 */
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
if (!("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, "ResizeObserver", {
    configurable: true,
    value: ResizeObserverStub,
  });
}
for (const method of ["hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const) {
  if (!(method in Element.prototype)) {
    Object.defineProperty(Element.prototype, method, {
      configurable: true,
      value: method === "hasPointerCapture" ? () => false : () => {},
    });
  }
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: DEFAULT_VIEWPORT.width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: DEFAULT_VIEWPORT.height,
  });
  // Persisted stores write to storage; start each test from a clean slate.
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});
