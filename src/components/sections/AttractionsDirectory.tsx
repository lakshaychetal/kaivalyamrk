/**
 * `AttractionsDirectory` — categorized local attractions (Req 7.1–7.7).
 * -----------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 12.2)
 *
 * Groups the full attractions catalog into the 11 canonical categories (Req 7.1)
 * using the pure domain helper `groupByCategory`. The Religious Sites category
 * is further split into Hindu, Jain, Christian, and Muslim subgroups (Req 7.5)
 * using `groupReligiousBySubgroup`.
 *
 * Layout:
 *   • Each category is a `<section>` with an `h2` heading and a subtle divider.
 *   • Religious subgroups use `h3` headings within the Religious Sites section.
 *   • Responsive card grid: 1 col on mobile → 2 on sm → 3 on lg.
 *   • Lucide icons for each category heading (Mountain, Droplets, Church, etc.).
 *   • Semantic tokens only — never raw hex.
 *
 * Server component — pure presentation of static content.
 */

import {
  Landmark,
  Waves,
  Mountain,
  Droplets,
  Church,
  Leaf,
  PawPrint,
  Sailboat,
  Sparkles,
  ShoppingBag,
  Palette,
  type LucideIcon,
} from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { AttractionCard } from "@/components/sections/AttractionCard";
import {
  groupByCategory,
  groupReligiousBySubgroup,
} from "@/domain/attractions";
import {
  ATTRACTION_CATEGORY_IDS,
  RELIGIOUS_SUBGROUPS,
  type AttractionCategoryId,
  type ReligiousSubgroup,
  type AttractionItem,
} from "@/content/types";

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

/** Human-readable labels for the 11 attraction categories (Req 7.1). */
const CATEGORY_LABELS: Record<AttractionCategoryId, string> = {
  historic_sites_gardens: "Historic Sites & Gardens",
  dams_caverns_caves: "Dams, Caverns & Caves",
  mountain_sites: "Mountain Sites",
  waterfalls_lookouts: "Waterfalls & Lookouts",
  religious_sites: "Religious Sites",
  nature_wildlife_areas: "Nature & Wildlife Areas",
  wildlife_zoos_aquariums: "Wildlife, Zoos & Aquariums",
  bodies_of_water: "Bodies of Water",
  ayurveda_spas: "Ayurveda & SPAs",
  specialty_gift_shops: "Specialty & Gift Shops",
  art_galleries_theme_parks: "Art Galleries & Theme Parks",
};

/** Lucide icon for each category heading (design spec). */
const CATEGORY_ICONS: Record<AttractionCategoryId, LucideIcon> = {
  historic_sites_gardens: Landmark,
  dams_caverns_caves: Waves,
  mountain_sites: Mountain,
  waterfalls_lookouts: Droplets,
  religious_sites: Church,
  nature_wildlife_areas: Leaf,
  wildlife_zoos_aquariums: PawPrint,
  bodies_of_water: Sailboat,
  ayurveda_spas: Sparkles,
  specialty_gift_shops: ShoppingBag,
  art_galleries_theme_parks: Palette,
};

/** Human-readable labels for the 4 religious subgroups (Req 7.5). */
const SUBGROUP_LABELS: Record<ReligiousSubgroup, string> = {
  hindu: "Hindu",
  jain: "Jain",
  christian: "Christian",
  muslim: "Muslim",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A responsive grid of AttractionCards. */
function AttractionGrid({ items }: { items: readonly AttractionItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((attraction) => (
        <li key={attraction.id} className="h-full">
          <AttractionCard attraction={attraction} />
        </li>
      ))}
    </ul>
  );
}

/** A single non-religious category section with h2 heading + card grid. */
function CategorySection({
  categoryId,
  items,
}: {
  categoryId: AttractionCategoryId;
  items: readonly AttractionItem[];
}) {
  if (items.length === 0) return null;

  const label = CATEGORY_LABELS[categoryId];
  const CategoryIcon = CATEGORY_ICONS[categoryId];
  const headingId = `category-${categoryId}`;

  return (
    <section aria-labelledby={headingId} className="scroll-mt-20">
      {/* Subtle divider above each category */}
      <div className="mb-6 border-t border-border" aria-hidden="true" />
      <h2
        id={headingId}
        className="flex items-center gap-3 font-serif text-2xl font-semibold text-secondary md:text-3xl"
      >
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
          aria-hidden="true"
        >
          <Icon icon={CategoryIcon} size="md" />
        </span>
        {label}
      </h2>
      <AttractionGrid items={items} />
    </section>
  );
}

/** The Religious Sites section — h2 for the category, h3 for each subgroup. */
function ReligiousSitesSection({
  items,
}: {
  items: readonly AttractionItem[];
}) {
  if (items.length === 0) return null;

  const subgroups = groupReligiousBySubgroup(items);
  const headingId = "category-religious_sites";

  return (
    <section aria-labelledby={headingId} className="scroll-mt-20">
      <div className="mb-6 border-t border-border" aria-hidden="true" />
      <h2
        id={headingId}
        className="flex items-center gap-3 font-serif text-2xl font-semibold text-secondary md:text-3xl"
      >
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
          aria-hidden="true"
        >
          <Icon icon={Church} size="md" />
        </span>
        Religious Sites
      </h2>

      <div className="mt-6 flex flex-col gap-10">
        {RELIGIOUS_SUBGROUPS.map((subgroup) => {
          const subItems = subgroups[subgroup];
          if (subItems.length === 0) return null;

          const subHeadingId = `subgroup-${subgroup}`;
          return (
            <div key={subgroup}>
              <h3
                id={subHeadingId}
                className="font-serif text-xl font-semibold text-secondary md:text-2xl"
              >
                {SUBGROUP_LABELS[subgroup]}
              </h3>
              <AttractionGrid items={subItems} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface AttractionsDirectoryProps {
  /** The full attractions catalog. Defaults to the generated catalog. */
  attractions: readonly AttractionItem[];
  /** Extra classes appended to the root element. */
  className?: string;
}

/**
 * Renders the full attractions directory grouped into 11 categories, with
 * Religious Sites further split into 4 subgroups.
 */
export function AttractionsDirectory({
  attractions,
  className,
}: AttractionsDirectoryProps) {
  const groups = groupByCategory(attractions);

  return (
    <div className={cn("flex flex-col gap-12", className)}>
      {ATTRACTION_CATEGORY_IDS.map((categoryId) => {
        const items = groups[categoryId];

        if (categoryId === "religious_sites") {
          return (
            <ReligiousSitesSection key={categoryId} items={items} />
          );
        }

        return (
          <CategorySection
            key={categoryId}
            categoryId={categoryId}
            items={items}
          />
        );
      })}
    </div>
  );
}

export default AttractionsDirectory;
