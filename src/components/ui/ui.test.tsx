/**
 * Unit tests for the core design-system components (task 3.1).
 * ------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the accessibility + interaction contract that the task and Reqs
 * 19.5/19.6/22.3/22.5/22.7/18.5 require:
 *   • Button variants, disabled/loading semantics, icon-only accessible name.
 *   • BookNowButton is the single primary CTA and resolves to the booking URL.
 *   • Card renders its variants/slots.
 *   • Form controls expose visible labels, helper text, required indicator,
 *     and validate on blur with a `role="alert"` error wired via
 *     `aria-describedby`.
 *
 * (Property 22 — the broader a11y property test — is task 3.4.)
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Search } from "lucide-react";

import { Button, IconButton } from "./Button";
import { BookNowButton } from "./BookNowButton";
import { Card, CardTitle, CardBody } from "./Card";
import { Input } from "./form/Input";
import { Select } from "./form/Select";
import { buttonClassNames } from "./buttonStyles";
import { BOOKING_HREF } from "@/domain/navigation/navigation";
import { kaivalyamBookingUrl } from "@/domain/integration-urls/booking-url";

describe("Button", () => {
  it("renders a clickable button with its label", async () => {
    const user = userEvent.setup();
    let clicks = 0;
    render(<Button onClick={() => (clicks += 1)}>Continue</Button>);
    const btn = screen.getByRole("button", { name: "Continue" });
    await user.click(btn);
    expect(clicks).toBe(1);
  });

  it("enforces a ≥44px min target and a focus-ring outline via classes", () => {
    render(<Button>Go</Button>);
    const btn = screen.getByRole("button", { name: "Go" });
    expect(btn.className).toContain("min-h-11");
    expect(btn.className).toContain("min-w-11");
    expect(btn.className).toContain("focus-visible:[outline:2px_solid_var(--color-focus)]");
  });

  it("gates press feedback behind motion-safe (reduced-motion handling)", () => {
    render(<Button>Go</Button>);
    const btn = screen.getByRole("button", { name: "Go" });
    expect(btn.className).toContain("motion-safe:active:scale-[0.98]");
  });

  it("is disabled and busy while loading", () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole("button", { name: /saving/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("disabled state applies reduced opacity + not-allowed cursor classes", () => {
    render(<Button disabled>Nope</Button>);
    const btn = screen.getByRole("button", { name: "Nope" });
    expect(btn).toBeDisabled();
    expect(btn.className).toContain("disabled:opacity-50");
    expect(btn.className).toContain("disabled:cursor-not-allowed");
  });

  it("IconButton exposes an accessible name for an icon-only control", () => {
    render(<IconButton icon={Search} aria-label="Search" />);
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });
});

describe("BookNowButton — the single primary CTA", () => {
  it("defaults to label 'Book Now' and links to the in-site booking host", () => {
    render(<BookNowButton />);
    const link = screen.getByRole("link", { name: /book now/i });
    expect(link).toHaveAttribute("href", BOOKING_HREF);
  });

  it("links to the eeabsolute booking URL (safe new context) when external", () => {
    render(<BookNowButton external />);
    const link = screen.getByRole("link", { name: /book now/i });
    expect(link).toHaveAttribute("href", kaivalyamBookingUrl());
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("uses the same canonical primary style as buttonClassNames primary", () => {
    render(<BookNowButton />);
    const link = screen.getByRole("link", { name: /book now/i });
    // The primary look is centralized: BookNowButton carries the primary tokens.
    expect(link.className).toContain("bg-primary");
    expect(link.className).toContain("text-on-primary");
    expect(buttonClassNames({ variant: "primary" })).toContain("bg-primary");
  });
});

describe("Card", () => {
  it("renders media, body, and footer slots for a room variant", () => {
    render(
      <Card
        variant="room"
        media={<div role="img" aria-label="Luxury cottage" />}
        footer={<BookNowButton label="Book this room" />}
      >
        <CardTitle>Luxury Cottage</CardTitle>
        <CardBody>A duplex with a roof balcony.</CardBody>
      </Card>,
    );
    expect(screen.getByText("Luxury Cottage")).toBeInTheDocument();
    expect(screen.getByText("A duplex with a roof balcony.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Luxury cottage" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book this room" })).toBeInTheDocument();
  });
});

describe("Input — visible label, helper, on-blur validation", () => {
  it("renders a visible label, helper text, and required indicator", () => {
    render(
      <Input
        label="Email"
        helperText="We'll only use this to confirm your booking."
        required
        type="email"
      />,
    );
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(
      screen.getByText("We'll only use this to confirm your booking."),
    ).toBeInTheDocument();
  });

  it("does not show an error mid-typing, only after blur (inline validation)", async () => {
    const user = userEvent.setup();
    const validate = (v: string) =>
      v.includes("@") ? null : "Enter a valid email address.";
    render(<Input label="Email" type="email" validate={validate} />);
    const input = screen.getByLabelText(/email/i);

    await user.type(input, "bad");
    // Still typing → no error yet.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.tab(); // blur
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Enter a valid email address.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    // Error is wired to the control via aria-describedby.
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
  });
});

describe("Select", () => {
  it("renders a labelled select with a placeholder and options", () => {
    render(
      <Select
        label="Room type"
        placeholder="Choose a room"
        options={[
          { value: "luxury-cottage", label: "Luxury Cottage" },
          { value: "classic-room", label: "Classic Room" },
        ]}
      />,
    );
    const select = screen.getByLabelText(/room type/i);
    expect(select).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Luxury Cottage" }),
    ).toBeInTheDocument();
  });
});
