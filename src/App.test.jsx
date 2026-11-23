import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import App from "./App.jsx";

vi.mock("./components/FisheyeGrid/FisheyeInfiniteGrid.jsx", () => ({
  default: () => <div>Wallpaper grid</div>,
}));

test("shows the loading state while photos are requested", () => {
  global.fetch = vi.fn(() =>
    new Promise(() => {}),
  );

  render(<App />);
  expect(screen.getByRole("status")).toBeInTheDocument();
});
