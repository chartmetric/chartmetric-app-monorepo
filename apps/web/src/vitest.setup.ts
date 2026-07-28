import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

// Mantine components rely on browser APIs that jsdom does not implement.
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

class ResizeObserverMock {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
