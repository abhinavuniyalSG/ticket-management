import "@testing-library/jest-dom/vitest";
import { cloneElement, type ReactElement } from "react";
import { afterEach, vi } from "vitest";

// jsdom has no layout engine, so recharts' <ResponsiveContainer> (which
// normally measures its DOM node via ResizeObserver) would otherwise see a
// permanent 0x0 and never render its children - and worse, that measurement
// is asynchronous even when mocked, which races with RTL's `act()` batching
// in ways that only surface once a chart is mounted indirectly (e.g. after a
// data fetch resolves) rather than in a synchronous top-level `render()`.
// Sidestep all of that by giving chart components an explicit, deterministic
// size directly, exactly like ResponsiveContainer does internally.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      cloneElement(children, { width: 600, height: 300 } as Record<string, unknown>),
  };
});

// jsdom also doesn't implement SVG text measurement (getBBox), which recharts
// uses to lay out and de-collide axis ticks/labels; without it, ticks silently
// disappear instead of throwing.
Object.defineProperty(SVGElement.prototype, "getBBox", {
  configurable: true,
  value: () => ({ x: 0, y: 0, width: 100, height: 20 }),
});

// recharts also appends a singleton `#recharts_measurement_span` straight to
// `document.body` (outside React's tree) to measure tick/label text width,
// and never removes it - so it survives RTL's unmount-based cleanup and
// leaks stale text into the next test's queries. Sweep it up after each test.
afterEach(() => {
  document.getElementById("recharts_measurement_span")?.remove();
});
