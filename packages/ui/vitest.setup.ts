import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Mantine and recharts rely on browser APIs that jsdom does not implement.

// Node 26 defines a global `localStorage` that is non-functional without
// --localstorage-file and shadows jsdom's. defineProperty avoids reading the
// broken getter (which would print an ExperimentalWarning).
class MemoryStorage implements Storage {
  readonly #store = new Map<string, string>();

  get length(): number {
    return this.#store.size;
  }

  clear(): void {
    this.#store.clear();
  }

  getItem(key: string): string | null {
    return this.#store.get(key) ?? null;
  }

  key(index: number): string | null {
    let current = 0;
    for (const storedKey of this.#store.keys()) {
      if (current === index) {
        return storedKey;
      }
      current += 1;
    }
    return null;
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, value);
  }
}

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: new MemoryStorage(),
});

vi.stubGlobal(
  "matchMedia",
  vi.fn(
    (query: string): MediaQueryList =>
      ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
        matches: false,
        media: query,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      }) as unknown as MediaQueryList,
  ),
);

// Reports a fixed size on observe so components that measure themselves
// (e.g. recharts' ResponsiveContainer) render instead of warning about 0x0.
class ResizeObserverMock {
  readonly #callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
  }

  disconnect(): void {
    // nothing to disconnect in tests
  }

  observe(target: Element): void {
    this.#callback(
      [
        {
          contentRect: { height: 600, width: 800 },
          target,
        } as unknown as ResizeObserverEntry,
      ],
      this,
    );
  }

  unobserve(): void {
    // nothing to unobserve in tests
  }
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
