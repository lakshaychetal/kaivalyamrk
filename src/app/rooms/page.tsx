/**
 * Rooms page (`/rooms`) — accommodation details for both room types.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 11.3)
 *
 * Presents the two Kaivalyam accommodation entries as separate, clearly
 * distinguished sections so a Guest can compare and choose before booking:
 *
 *   • Req 4.1 — Luxury Cottage and Classic Room as separate entries.
 *   • Req 4.2 — Luxury Cottage described as a duplex with attached bathroom,
 *               roof balcony and sit-out, indoor play area, private laundry,
 *               and gazebo.
 *   • Req 4.3 — Classic Room described as an affordable, cozy room with
 *               essential amenities.
 *   • Req 4.4 — Full amenity list for each room type, with Lucide Check icons.
 *   • Req 4.5 — Property photos for each room type drawn from the generated
 *               catalog (interiors/ and architecture/ categories).
 *   • Req 4.6 — Per-room "Book This Room" action via BookNowButton resolving
 *               to the booking engine.
 *
 * Design / UX contract:
 *   • Rich, hotel-quality room presentation: large hero image per room,
 *     amenity grid, prominent booking CTA.
 *   • Semantic tokens only — never raw hex.
 *   • Sequential heading hierarchy: h1 "Our Rooms" → h2 per room name.
 *   • Accessible: alt text on all images (via ResponsiveImage), visible focus
 *     rings (design-system tokens), reduced-motion safe (motion-safe: prefix).
 *   • Mobile-first, no horizontal scroll at 375px+.
 *   • Lucide Check icons for amenity list items (Req 19.4).
 *
 * Server component — pure presentation of static content, no client state.
 *
 * Per-page metadata/OpenGraph/JSON-LD are wired centrally via `buildPageMeta`
 * in task 15.3; this file declares only a minimal local title in the meantime
 * (Req 21.1).
 */
import type { Metadata } from "next";
import { Check } from "lucide-react";

import { BookNowButton } from "@/components/ui/BookNowButton";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Icon } from "@/components/ui/Icon";
import { rooms } from "@/content/rooms";
import { filterByCategory } from "@/domain/gallery";
import { photoCatalog } from "@/content/generated";
import type { Photo, PhotoCategoryId, Room } from "@/content/types";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('rooms');

// ---------------------------------------------------------------------------
// Photo selection helpers
// ---------------------------------------------------------------------------

/**
 * Categories to draw room photos from, in priority order.
 * The task specifies interiors/ and architecture/ categories (Req 4.5).
 * We also include exteriors/ as a fallback so the page always has photos.
 */
const LUXURY_COTTAGE_PHOTO_CATEGORIES: readonly PhotoCategoryId[] = [
  "interiors",
  "architecture",
  "exteriors",
];

const CLASSIC_ROOM_PHOTO_CATEGORIES: readonly PhotoCategoryId[] = [
  "interiors",
  "exteriors",
  "architecture",
];

/** Maximum photos to show per room to keep the page focused. */
const MAX_PHOTOS_PER_ROOM = 4;

/**
 * Collect up to `max` photos from the given category list, drawing from each
 * category in order. Uses the pure `filterByCategory` domain helper (task 7.1).
 */
function collectRoomPhotos(
  categories: readonly PhotoCategoryId[],
  max: number,
): Photo[] {
  const collected: Photo[] = [];
  for (const categoryId of categories) {
    if (collected.length >= max) break;
    const photos = filterByCategory(photoCatalog, categoryId);
    const remaining = max - collected.length;
    collected.push(...photos.slice(0, remaining));
  }
  return collected;
}

const luxuryCottagePhotos = collectRoomPhotos(
  LUXURY_COTTAGE_PHOTO_CATEGORIES,
  MAX_PHOTOS_PER_ROOM,
);

const classicRoomPhotos = collectRoomPhotos(
  CLASSIC_ROOM_PHOTO_CATEGORIES,
  MAX_PHOTOS_PER_ROOM,
);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single amenity row: Lucide Check icon + amenity text (Req 4.4). */
function AmenityItem({ amenity }: { amenity: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-on-surface sm:text-base">
      <span
        className="mt-0.5 flex-shrink-0 text-primary"
        aria-hidden="true"
      >
        <Icon icon={Check} size="sm" />
      </span>
      <span>{amenity}</span>
    </li>
  );
}

/** The amenity grid for a room (Req 4.4). */
function AmenityList({ amenities }: { amenities: string[] }) {
  return (
    <section aria-label="Amenities">
      <h3 className="font-serif text-lg font-semibold text-secondary">
        Amenities
      </h3>
      <ul
        className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2"
        aria-label="Amenity list"
      >
        {amenities.map((amenity) => (
          <AmenityItem key={amenity} amenity={amenity} />
        ))}
      </ul>
    </section>
  );
}

/** Photo gallery strip for a room (Req 4.5). */
function RoomPhotoGallery({
  photos,
  roomName,
}: {
  photos: Photo[];
  roomName: string;
}) {
  if (photos.length === 0) return null;

  const [heroPhoto, ...thumbPhotos] = photos;

  return (
    <div className="flex flex-col gap-3">
      {/* Hero image — large, prominent */}
      {heroPhoto && (
        <ResponsiveImage
          image={heroPhoto}
          sizes="(min-width: 1024px) 50vw, 100vw"
          fill
          className="rounded-xl object-cover"
          wrapperClassName="w-full overflow-hidden rounded-xl border border-border aspect-[16/10]"
          priority={false}
        />
      )}

      {/* Thumbnail row */}
      {thumbPhotos.length > 0 && (
        <ul
          className="grid grid-cols-3 gap-3"
          aria-label={`More photos of ${roomName}`}
        >
          {thumbPhotos.map((photo) => (
            <li key={photo.id}>
              <ResponsiveImage
                image={photo}
                sizes="(min-width: 1024px) 17vw, (min-width: 640px) 33vw, 33vw"
                fill
                className="rounded-lg object-cover"
                wrapperClassName="w-full overflow-hidden rounded-lg border border-border aspect-[4/3]"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A full room entry section (Req 4.1–4.6). */
function RoomSection({
  room,
  photos,
  headingId,
}: {
  room: Room;
  photos: Photo[];
  headingId: string;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className="scroll-mt-24 rounded-2xl border border-border bg-surface shadow-md"
    >
      {/* Room header band */}
      <div className="border-b border-border bg-surface-alt px-6 py-6 sm:px-8">
        <h2
          id={headingId}
          className="font-serif text-2xl font-semibold text-secondary sm:text-3xl"
        >
          {room.name}
        </h2>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-on-surface-muted">
          {room.summary}
        </p>
      </div>

      {/* Two-column layout on desktop: photos left, details right */}
      <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:gap-12">
        {/* Photos column (Req 4.5) */}
        <div className="lg:w-1/2 lg:flex-shrink-0">
          <RoomPhotoGallery photos={photos} roomName={room.name} />
        </div>

        {/* Details column */}
        <div className="flex flex-1 flex-col gap-8">
          {/* Description */}
          <div>
            <p className="max-w-prose text-base leading-relaxed text-on-surface">
              {room.description}
            </p>
          </div>

          {/* Amenity list (Req 4.4) */}
          <AmenityList amenities={room.amenities} />

          {/* Booking CTA (Req 4.6) */}
          <div className="mt-auto pt-2">
            <BookNowButton
              label="Book This Room"
              href={room.bookingHref}
              external
              size="lg"
              aria-label={`Book the ${room.name}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RoomsPage() {
  const [luxuryCottage, classicRoom] = rooms;

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
      {/* Page header */}
      <header className="mb-12">
        <p className="text-sm font-medium uppercase tracking-wide text-on-surface-muted">
          Accommodation
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          Our Rooms
        </h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-on-surface-muted">
          Two distinct stays, one unhurried address. Choose the space that fits
          your journey — both come with the same warm Kaivalyam hospitality.
        </p>
      </header>

      {/* Room entries (Req 4.1) */}
      <div className="flex flex-col gap-12">
        {/* Luxury Cottage (Req 4.2) */}
        {luxuryCottage && (
          <RoomSection
            room={luxuryCottage}
            photos={luxuryCottagePhotos}
            headingId="luxury-cottage-heading"
          />
        )}

        {/* Classic Room (Req 4.3) */}
        {classicRoom && (
          <RoomSection
            room={classicRoom}
            photos={classicRoomPhotos}
            headingId="classic-room-heading"
          />
        )}
      </div>
    </article>
  );
}
