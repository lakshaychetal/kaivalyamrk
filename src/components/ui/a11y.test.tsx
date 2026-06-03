/**
 * Property + unit tests for accessibility invariants of interactive/feedback UI.
 * -----------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.4)
 *
 * Exercises the three accessibility invariants the design system must uphold for
 * every interactive and feedback element it renders:
 *   • A visible (non-`none`) focus indicator is applied to every interactive
 *     control — the shared `focusRing` draws a `2px solid var(--color-focus)`
 *     outline on `:focus-visible` (Req 22.3).
 *   • Every icon-only control exposes a non-empty accessible name (Req 22.5).
 *   • Every status/feedback element carries a non-color cue (an icon AND text)
 *     alongside its color cue (Req 22.6).
 *
 * **Validates: Requirements 22.3, 22.5, 22.6**
 */
import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import fc from "fast-check";
import { Search, Menu, X, Heart, MapPin, Share2 } from "lucide-react";

import { assertProperty } from "@/lib/pbt";
import { Button, IconButton } from "./Button";
import { BookNowButton } from "./BookNowButton";
import { Field } from "./form/Field";
import { Input } from "./form/Input";
import { focusRing } from "./buttonStyles";
import { WhatsAppEntryPoint } from "@/integration/whatsapp/WhatsAppEntryPoint";

/** The focus-visible outline declaration the visible focus ring must apply. */
const FOCUS_OUTLINE = "focus-visible:[outline:2px_solid_var(--color-focus)]";

/** A Lucide icon for icon-only controls (single icon family, Req 19.4). */
const iconArb = fc.constantFrom(Search, Menu, X, Heart, MapPin, Share2);

/** A guaranteed non-empty, human-readable accessible name. */
const labelArb = fc
  .array(
    fc.constantFrom(
      "Search",
      "Open",
      "Close",
      "Menu",
      "Share",
      "Map",
      "Save",
      "Filter",
      "Booking",
      "Photos",
    ),
    { minLength: 1, maxLength: 3 },
  )
  .map((words) => words.join(" "));

/** A non-empty feedback message. */
const messageArb = fc
  .array(
    fc.constantFrom(
      "Enter",
      "a",
      "valid",
      "email",
      "address",
      "phone",
      "number",
      "required",
      "field",
    ),
    { minLength: 1, maxLength: 5 },
  )
  .map((words) => words.join(" "));

describe("Property 22 — accessibility invariants for interactive and feedback elements", () => {
  // Feature: kaivalyam-homestay-website, Property 22: Accessibility invariants for interactive and feedback elements
  it("the shared focus ring is a visible, non-none outline", () => {
    // The single focus-indicator definition every control composes (Req 22.3).
    expect(focusRing).toContain(FOCUS_OUTLINE);
    expect(focusRing).not.toContain("focus-visible:[outline:none]");
  });

  // Feature: kaivalyam-homestay-website, Property 22: Accessibility invariants for interactive and feedback elements
  it("every interactive control applies a visible (non-none) focus indicator", () => {
    assertProperty(
      fc.property(
        fc.constantFrom("primary", "secondary", "tertiary") as fc.Arbitrary<
          "primary" | "secondary" | "tertiary"
        >,
        fc.constantFrom("sm", "md", "lg") as fc.Arbitrary<"sm" | "md" | "lg">,
        fc.constantFrom("button", "booknow", "input", "whatsapp", "iconbutton"),
        iconArb,
        labelArb,
        (variant, size, kind, icon, label) => {
          const { container, unmount } = render(
            kind === "button" ? (
              <Button variant={variant} size={size}>
                Action
              </Button>
            ) : kind === "booknow" ? (
              <BookNowButton size={size} />
            ) : kind === "input" ? (
              <Input label="Email" type="email" />
            ) : kind === "whatsapp" ? (
              <WhatsAppEntryPoint />
            ) : (
              <IconButton icon={icon} aria-label={label} size={size} />
            ),
          );

          try {
            // The focusable element is the interactive control on screen.
            const control =
              container.querySelector("button") ??
              container.querySelector("a") ??
              container.querySelector("input");
            expect(control).not.toBeNull();
            // A visible focus indicator (non-none outline) is applied (Req 22.3).
            expect(control?.className ?? "").toContain(FOCUS_OUTLINE);
            expect(control?.className ?? "").not.toContain(
              "focus-visible:[outline:none]",
            );
          } finally {
            unmount();
          }
        },
      ),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 22: Accessibility invariants for interactive and feedback elements
  it("every icon-only control exposes a non-empty accessible name", () => {
    assertProperty(
      fc.property(iconArb, labelArb, fc.boolean(), (icon, label, asFab) => {
        const { container, unmount } = asFab
          ? render(<WhatsAppEntryPoint variant="fab" aria-label={label} />)
          : render(<IconButton icon={icon} aria-label={label} />);

        try {
          const control = within(container).getByRole(asFab ? "link" : "button");
          // The icon-only control has a non-empty accessible name (Req 22.5).
          expect(control).toHaveAccessibleName(label);
          expect(label.trim().length).toBeGreaterThan(0);
        } finally {
          unmount();
        }
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 22: Accessibility invariants for interactive and feedback elements
  it("every status/feedback element carries a non-color cue (icon AND text)", () => {
    assertProperty(
      fc.property(messageArb, (message) => {
        const { container, unmount } = render(
          <Field label="Email" error={message}>
            {(field) => <input type="email" {...field} />}
          </Field>,
        );

        try {
          const alert = within(container).getByRole("alert");
          // Text cue: the message is rendered as text, not conveyed by color
          // alone (Req 22.6).
          expect(alert).toHaveTextContent(message);
          // Icon cue: a Lucide glyph accompanies the colored text (Req 22.6).
          expect(alert.querySelector("svg")).not.toBeNull();
        } finally {
          unmount();
        }
      }),
    );
  });
});

describe("accessibility invariants — example checks", () => {
  it("an icon-only IconButton without an accessible name is a misuse we guard against", () => {
    const { getByRole } = render(<IconButton icon={Search} aria-label="Search" />);
    expect(getByRole("button")).toHaveAccessibleName("Search");
  });

  it("a Field error renders role=alert with both an icon and the message text", () => {
    const { getByRole } = render(
      <Field label="Email" error="Enter a valid email address.">
        {(field) => <input type="email" {...field} />}
      </Field>,
    );
    const alert = getByRole("alert");
    expect(alert).toHaveTextContent("Enter a valid email address.");
    expect(alert.querySelector("svg")).not.toBeNull();
  });

  it("a Button shows the visible focus-ring outline class", () => {
    const { getByRole } = render(<Button>Go</Button>);
    expect(getByRole("button").className).toContain(FOCUS_OUTLINE);
  });
});
