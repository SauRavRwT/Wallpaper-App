import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import FisheyeInfiniteGrid from "./FisheyeInfiniteGrid.jsx";

afterEach(() => {
  delete HTMLElement.prototype.setPointerCapture;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("opens a photo when its tile receives a desktop pointer click", () => {
  class MockResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe() {
      this.callback();
    }

    disconnect() {}
  }

  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const captureTargets = [];
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value() {
      captureTargets.push(this);
    },
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

  const { container } = render(
    <FisheyeInfiniteGrid
      items={[{ id: 1, image: "photo.jpg", title: "Photographer" }]}
    />,
  );
  const tile = container.querySelector(".fig-tile");

  fireEvent.pointerDown(tile, {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    clientX: 100,
    clientY: 100,
  });

  expect(captureTargets).toEqual([tile]);

  fireEvent.pointerUp(tile, {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    clientX: 100,
    clientY: 100,
  });

  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
