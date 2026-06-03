/**
 * Tests for the Gallery page, GalleryGrid, Lightbox, and VirtualTour (task 12.1).
 * ---------------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 6.1–6.7 contract:
 *   • 6.1/6.2 — gallery renders photos from all 9 categories.
 *   • 6.3     — category filter shows only matching photos.
 *   • 6.4     — clicking a photo opens the lightbox.
 *   • 6.5     — lightbox closes on Escape; next/previous navigation works.
 *   • 6.6     — virtual tour renders category names and navigates.
 *   • 6.7     — every photo has descriptive alt text.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Mock next/image so it renders a plain <img> in jsdom
// ---------------------------------------------------------------------------
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onLoad,
    onError,
    ...rest
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    onLoad?: () => void;
    onError?: () => void;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onLoad={onLoad} onError={onError} {...rest} />
  ),
}));
import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { VirtualTour } from "@/components/sections/VirtualTour";
import { Lightbox } from "@/components/gallery/Lightbox";
import { photoCatalog } from "@/content/generated/photo-catalog";
import { allPhotos, filterByCategory } from "@/domain/gallery";
import type { Photo } from "@/content/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Photo fixture for Lightbox tests. */
function makePhoto(id: string, alt: string): Photo {
  return {
    id,
    src: `/test/${id}.jpg`,
    alt,
    width: 800,
    height: 600,
    source: "owned",
    category: "exteriors",
  };
}

const PHOTO_A = makePhoto("photo-a", "Photo A — Kaivalyam Homestay");
const PHOTO_B = makePhoto("photo-b", "Photo B — Kaivalyam Homestay");
const PHOTO_C = makePhoto("photo-c", "Photo C — Kaivalyam Homestay");
const THREE_PHOTOS: Photo[] = [PHOTO_A, PHOTO_B, PHOTO_C];

// ---------------------------------------------------------------------------
// GalleryGrid tests
// ---------------------------------------------------------------------------

describe("GalleryGrid", () => {
  it("renders the Photo Gallery heading", () => {
    render(<GalleryGrid />);
    expect(
      screen.getByRole("heading", { name: /photo gallery/i }),
    ).toBeInTheDocument();
  });

  it("renders photos from the catalog (Req 6.2)", () => {
    render(<GalleryGrid />);
    const photos = allPhotos(photoCatalog);
    // At least one photo should be visible (the gallery list)
    expect(photos.length).toBeGreaterThan(0);
    // The gallery list should be present
    expect(screen.getByRole("list", { name: /gallery photos/i })).toBeInTheDocument();
  });

  it("renders category filter tabs including 'All' (Req 6.1, 6.3)", () => {
    render(<GalleryGrid />);
    // The "All" tab should be present
    expect(
      screen.getByRole("tab", { name: /^all/i }),
    ).toBeInTheDocument();
    // At least some category tabs should be present
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(1);
  });

  it("'All' tab is selected by default", () => {
    render(<GalleryGrid />);
    const allTab = screen.getByRole("tab", { name: /^all/i });
    expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  it("clicking a category tab filters photos to that category (Req 6.3)", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid />);

    // Find the "Exteriors" tab
    const exteriorsTab = screen.getByRole("tab", { name: /exteriors/i });
    await user.click(exteriorsTab);

    // The tab should now be selected
    expect(exteriorsTab).toHaveAttribute("aria-selected", "true");

    // The live region should announce the category
    const liveRegion = screen.getByText(/showing/i);
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion.textContent).toMatch(/exteriors/i);

    // The number of displayed photos should match the category count
    const exteriorsPhotos = filterByCategory(photoCatalog, "exteriors");
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(exteriorsPhotos.length);
  });

  it("clicking 'All' tab after filtering shows all photos", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid />);

    // Filter to a category first
    const exteriorsTab = screen.getByRole("tab", { name: /exteriors/i });
    await user.click(exteriorsTab);

    // Then click All
    const allTab = screen.getByRole("tab", { name: /^all/i });
    await user.click(allTab);

    expect(allTab).toHaveAttribute("aria-selected", "true");
    const allPhotosList = allPhotos(photoCatalog);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(allPhotosList.length);
  });

  it("every photo button has a descriptive aria-label (Req 6.7)", () => {
    render(<GalleryGrid />);
    const photoButtons = screen.getAllByRole("button", {
      name: /view enlarged:/i,
    });
    expect(photoButtons.length).toBeGreaterThan(0);
    for (const btn of photoButtons) {
      const label = btn.getAttribute("aria-label") ?? "";
      expect(label.length).toBeGreaterThan(0);
      expect(label).toMatch(/view enlarged:/i);
    }
  });

  it("clicking a photo opens the lightbox (Req 6.4)", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid />);

    const photoButtons = screen.getAllByRole("button", {
      name: /view enlarged:/i,
    });
    expect(photoButtons.length).toBeGreaterThan(0);

    await user.click(photoButtons[0]!);

    // The lightbox dialog should appear
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("lightbox closes when the close button is clicked (Req 6.5)", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid />);

    // Open lightbox
    const photoButtons = screen.getAllByRole("button", {
      name: /view enlarged:/i,
    });
    await user.click(photoButtons[0]!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via the X button
    const closeBtn = screen.getByRole("button", { name: /close gallery viewer/i });
    await user.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Lightbox tests (direct)
// ---------------------------------------------------------------------------

describe("Lightbox", () => {
  it("renders a dialog with the first photo", () => {
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={0} onClose={onClose} />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("shows the photo alt text in the caption", () => {
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={0} onClose={onClose} />,
    );
    expect(screen.getByText(PHOTO_A.alt)).toBeInTheDocument();
  });

  it("closes on Escape key (Req 6.5)", () => {
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={0} onClose={onClose} />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates to next photo on ArrowRight (Req 6.5)", () => {
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={0} onClose={onClose} />,
    );
    // Initially shows Photo A
    expect(screen.getByText(PHOTO_A.alt)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowRight" });

    // Now shows Photo B
    expect(screen.getByText(PHOTO_B.alt)).toBeInTheDocument();
  });

  it("navigates to previous photo on ArrowLeft (Req 6.5)", () => {
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={1} onClose={onClose} />,
    );
    // Initially shows Photo B (index 1)
    expect(screen.getByText(PHOTO_B.alt)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowLeft" });

    // Now shows Photo A (index 0)
    expect(screen.getByText(PHOTO_A.alt)).toBeInTheDocument();
  });

  it("wraps from last to first on ArrowRight (Req 6.5)", () => {
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={2} onClose={onClose} />,
    );
    // Initially shows Photo C (index 2, last)
    expect(screen.getByText(PHOTO_C.alt)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowRight" });

    // Wraps to Photo A (index 0)
    expect(screen.getByText(PHOTO_A.alt)).toBeInTheDocument();
  });

  it("wraps from first to last on ArrowLeft (Req 6.5)", () => {
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={0} onClose={onClose} />,
    );
    // Initially shows Photo A (index 0, first)
    expect(screen.getByText(PHOTO_A.alt)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowLeft" });

    // Wraps to Photo C (index 2, last)
    expect(screen.getByText(PHOTO_C.alt)).toBeInTheDocument();
  });

  it("renders next/previous buttons when there are multiple photos (Req 6.5)", () => {
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={0} onClose={onClose} />,
    );
    expect(
      screen.getByRole("button", { name: /next photo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /previous photo/i }),
    ).toBeInTheDocument();
  });

  it("renders a close button (Req 6.5)", () => {
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={0} onClose={onClose} />,
    );
    expect(
      screen.getByRole("button", { name: /close gallery viewer/i }),
    ).toBeInTheDocument();
  });

  it("clicking the overlay closes the lightbox (Req 6.5)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={0} onClose={onClose} />,
    );
    const overlay = screen.getByTestId("lightbox-overlay");
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates via next button click (Req 6.5)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={0} onClose={onClose} />,
    );
    expect(screen.getByText(PHOTO_A.alt)).toBeInTheDocument();

    const nextBtn = screen.getByRole("button", { name: /next photo/i });
    await user.click(nextBtn);

    expect(screen.getByText(PHOTO_B.alt)).toBeInTheDocument();
  });

  it("navigates via previous button click (Req 6.5)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Lightbox photos={THREE_PHOTOS} initialIndex={1} onClose={onClose} />,
    );
    expect(screen.getByText(PHOTO_B.alt)).toBeInTheDocument();

    const prevBtn = screen.getByRole("button", { name: /previous photo/i });
    await user.click(prevBtn);

    expect(screen.getByText(PHOTO_A.alt)).toBeInTheDocument();
  });

  it("returns null when photos array is empty", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Lightbox photos={[]} initialIndex={0} onClose={onClose} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// VirtualTour tests
// ---------------------------------------------------------------------------

describe("VirtualTour", () => {
  it("renders the Virtual Tour heading (Req 6.6)", () => {
    render(<VirtualTour />);
    expect(
      screen.getByRole("heading", { name: /virtual tour/i }),
    ).toBeInTheDocument();
  });

  it("renders the first category name on load (Req 6.6)", () => {
    render(<VirtualTour />);
    // The first category in VIRTUAL_TOUR_CATEGORY_ORDER is "night_ambiance"
    // Its label is "Night Ambiance" — appears in multiple places, use getAllByText
    const matches = screen.getAllByText(/night ambiance/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders Previous and Next controls (Req 6.6)", () => {
    render(<VirtualTour />);
    expect(
      screen.getByRole("button", { name: /previous category/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /next category/i }),
    ).toBeInTheDocument();
  });

  it("advances to the next category on Next click (Req 6.6)", async () => {
    const user = userEvent.setup();
    render(<VirtualTour />);

    // Initially on Night Ambiance — multiple elements may match
    expect(screen.getAllByText(/night ambiance/i).length).toBeGreaterThan(0);

    const nextBtn = screen.getByRole("button", { name: /next category/i });
    await user.click(nextBtn);

    // Should now show Exteriors (second in VIRTUAL_TOUR_CATEGORY_ORDER)
    // Multiple elements may match — use getAllByText
    expect(screen.getAllByText(/exteriors/i).length).toBeGreaterThan(0);
  });

  it("goes back to the previous category on Previous click (Req 6.6)", async () => {
    const user = userEvent.setup();
    render(<VirtualTour />);

    // Advance to Exteriors first
    const nextBtn = screen.getByRole("button", { name: /next category/i });
    await user.click(nextBtn);
    expect(screen.getAllByText(/exteriors/i).length).toBeGreaterThan(0);

    // Go back
    const prevBtn = screen.getByRole("button", { name: /previous category/i });
    await user.click(prevBtn);
    expect(screen.getAllByText(/night ambiance/i).length).toBeGreaterThan(0);
  });

  it("wraps from last category to first on Next (Req 6.6)", async () => {
    const user = userEvent.setup();
    render(<VirtualTour />);

    // Navigate to the last category (play_area, index 8) by clicking Next 8 times
    const nextBtn = screen.getByRole("button", { name: /next category/i });
    for (let i = 0; i < 8; i++) {
      await user.click(nextBtn);
    }
    // Should be on Play Area (last)
    expect(screen.getAllByText(/play area/i).length).toBeGreaterThan(0);

    // One more click wraps to Night Ambiance (first)
    await user.click(nextBtn);
    expect(screen.getAllByText(/night ambiance/i).length).toBeGreaterThan(0);
  });

  it("has an aria-live region announcing the current category (Req 22.4)", () => {
    render(<VirtualTour />);
    // The live region should be present with aria-live="polite"
    const liveEl = document.querySelector('[aria-live="polite"]');
    expect(liveEl).not.toBeNull();
    expect(liveEl?.getAttribute("aria-atomic")).toBe("true");
  });

  it("renders step dots for all 9 categories", () => {
    render(<VirtualTour />);
    const tabs = screen.getAllByRole("tab");
    // 9 step dots
    expect(tabs).toHaveLength(9);
  });

  it("clicking a step dot navigates to that category", async () => {
    const user = userEvent.setup();
    render(<VirtualTour />);

    // Click the "Exteriors" step dot — aria-label is "Go to Exteriors"
    const exteriorsTab = screen.getByRole("tab", {
      name: /go to exteriors/i,
    });
    await user.click(exteriorsTab);

    expect(screen.getAllByText(/exteriors/i).length).toBeGreaterThan(0);
  });

  it("renders a representative photo for the current category", () => {
    render(<VirtualTour />);
    // For night_ambiance, the virtual tour uses full_property_night_overview
    // as the representative photo (not index [0]).
    const nightAmbiancePhotos = filterByCategory(photoCatalog, "night_ambiance");
    const representativePhoto =
      nightAmbiancePhotos.find(
        (p) => p.id === "night_ambiance__full_property_night_overview",
      ) ?? nightAmbiancePhotos[0];
    if (representativePhoto) {
      const img = screen.getByAltText(representativePhoto.alt);
      expect(img).toBeInTheDocument();
    }
  });
});

// ---------------------------------------------------------------------------
// Alt text coverage (Req 6.7)
// ---------------------------------------------------------------------------

describe("Gallery alt text (Req 6.7)", () => {
  it("every photo in the catalog has non-empty alt text", () => {
    const photos = allPhotos(photoCatalog);
    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      expect(photo.alt.trim().length).toBeGreaterThan(0);
    }
  });

  it("every rendered photo button has a non-empty aria-label", () => {
    render(<GalleryGrid />);
    const photoButtons = screen.getAllByRole("button", {
      name: /view enlarged:/i,
    });
    for (const btn of photoButtons) {
      const label = btn.getAttribute("aria-label") ?? "";
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });
});
