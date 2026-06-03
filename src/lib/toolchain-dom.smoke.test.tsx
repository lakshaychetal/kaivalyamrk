/**
 * Toolchain smoke test (task 1.3) — DOM/component half.
 *
 * NOT a feature test. Proves React Testing Library + jsdom + the
 * @testing-library/jest-dom matchers are wired correctly by rendering a
 * trivial element and asserting on it. Real component tests are added later.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("toolchain smoke: React Testing Library + jsdom", () => {
  it("renders an element and matches with jest-dom", () => {
    render(<button aria-label="Book Now">Book Now</button>);

    const button = screen.getByRole("button", { name: "Book Now" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName("Book Now");
  });
});
