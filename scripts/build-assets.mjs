/**
 * Build-time asset pipeline (task 5.1).
 * ===========================================================================
 * Feature: kaivalyam-homestay-website
 *
 * Reads every source image under `kaivalyam_assets/property/` (10 folders) and
 * `kaivalyam_assets/attractions/` (folders `a`–`k`, with `e1`–`e4` the four
 * religious subgroups), then for each image:
 *
 *   1. Probes intrinsic width/height with `sharp` (EXIF-orientation aware).
 *   2. Encodes responsive variants in AVIF + WebP (+ a JPEG fallback) at
 *      400 / 800 / 1200 / 1600 widths, NEVER upscaling past the intrinsic
 *      width, writing deterministic filenames to `public/generated/…`.
 *   3. Assembles per-image `srcset` (one per format) and a `sizes` value.
 *   4. Emits TYPED, GENERATED modules the app imports:
 *        • src/content/generated/image-variants.ts  (ImageVariantMap)
 *        • src/content/generated/photo-catalog.ts    (PhotoCatalog + heroes)
 *        • src/content/generated/attractions.ts       (AttractionItem[])
 *        • src/content/generated/index.ts             (barrel)
 *
 * SOURCE TAGGING (see `ImageAsset` discriminated union in content/types.ts):
 *   • property/*      → 'owned'        (no attribution — Req 23.3)
 *   • attractions/*   → 'wikimedia'    (attribution REQUIRED — Req 23.1)
 *                       EXCEPT the 4 known AI-generated images → 'ai-generated'.
 *
 * ATTRIBUTION SEAM FOR TASK 5.2:
 *   This script does NOT author the real attribution data and does NOT run the
 *   build-fail validator — that is task 5.2. To keep the GENERATED modules
 *   compiling under strict types *today* (a `wikimedia` ImageAsset cannot exist
 *   without an `attribution`), every wikimedia image is given an attribution
 *   object sourced from `scripts/asset-data/attribution.json`, keyed by asset
 *   id. Any id missing from that file gets a clearly-marked, NON-EMPTY TODO
 *   placeholder so the union type is satisfied. Task 5.2 fills
 *   `attribution.json` with real license data and adds the validator that fails
 *   the build on placeholders / missing alt.
 *
 * Idempotent: deterministic output paths; an encoded variant is skipped when it
 * already exists and is newer than its source, so re-runs are cheap and produce
 * identical output.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SRC_PROPERTY = path.join(ROOT, "kaivalyam_assets", "property");
const SRC_ATTRACTIONS = path.join(ROOT, "kaivalyam_assets", "attractions");
const OUT_PUBLIC = path.join(ROOT, "public", "generated");
const OUT_GENERATED = path.join(ROOT, "src", "content", "generated");
const ATTRIBUTION_FILE = path.join(
  ROOT,
  "scripts",
  "asset-data",
  "attribution.json",
);

/** Responsive target widths (Req 20.4). We never upscale past intrinsic width. */
const TARGET_WIDTHS = [400, 800, 1200, 1600];

/** Per-format encoder settings (modern formats first — Req 20.1). */
const FORMATS = [
  { ext: "avif", mime: "image/avif", encode: (s) => s.avif({ quality: 50 }) },
  { ext: "webp", mime: "image/webp", encode: (s) => s.webp({ quality: 72 }) },
  {
    ext: "jpg",
    mime: "image/jpeg",
    encode: (s) => s.jpeg({ quality: 78, mozjpeg: true }),
  },
];

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

// ---------------------------------------------------------------------------
// Canonical category mappings (mirror of src/content/types.ts — single source
// of truth lives there; kept in sync here for the build script).
// ---------------------------------------------------------------------------

/** Property source folder → one of the 9 canonical PHOTO_CATEGORY_IDS. */
const PROPERTY_FOLDER_TO_CATEGORY = {
  night_ambiance: "night_ambiance",
  exteriors: "exteriors",
  outdoor_living: "outdoor_living",
  garden_pathways: "garden_pathways",
  interiors: "interiors",
  art_sculptures: "art_sculptures",
  architecture: "architecture",
  library_reading: "library_reading",
  play_area: "play_area",
  // The 10th source folder. There is no canonical `nature_details` gallery id,
  // so nature-detail shots fold into the closest gallery category
  // (`garden_pathways`). Currently empty, so this is a documented no-op seam.
  nature_details: "garden_pathways",
};

/** Canonical 9 gallery categories in display order + human labels (Req 6.1). */
const PHOTO_CATEGORIES = [
  { id: "night_ambiance", label: "Night Ambiance" },
  { id: "exteriors", label: "Exteriors" },
  { id: "outdoor_living", label: "Outdoor Living" },
  { id: "garden_pathways", label: "Garden & Pathways" },
  { id: "interiors", label: "Interiors" },
  { id: "art_sculptures", label: "Art & Sculptures" },
  { id: "architecture", label: "Architecture" },
  { id: "library_reading", label: "Library & Reading" },
  { id: "play_area", label: "Play Area" },
];

/** The gallery category whose photos are Home hero candidates (Req 2.1). */
const HERO_CATEGORY = "night_ambiance";

/**
 * Attraction source folder → { category, subgroup?, label }.
 * The 14 folders (`a`–`k`, `e1`–`e4`) map onto the 11 ATTRACTION_CATEGORY_IDS,
 * with `e1`–`e4` collapsing into `religious_sites` under their subgroup (Req 7.5).
 */
const ATTRACTION_FOLDER_MAP = {
  a_historic_sites_gardens: { category: "historic_sites_gardens", label: "Historic Sites & Gardens" },
  b_dams_caverns_caves: { category: "dams_caverns_caves", label: "Dams, Caverns & Caves" },
  c_mountain_sites: { category: "mountain_sites", label: "Mountain Sites" },
  d_waterfalls_lookouts: { category: "waterfalls_lookouts", label: "Waterfalls & Lookouts" },
  e1_hindu_temples: { category: "religious_sites", subgroup: "hindu", label: "Religious Sites" },
  e2_jain_temples: { category: "religious_sites", subgroup: "jain", label: "Religious Sites" },
  e3_christian_churches: { category: "religious_sites", subgroup: "christian", label: "Religious Sites" },
  e4_mosques: { category: "religious_sites", subgroup: "muslim", label: "Religious Sites" },
  f_nature_wildlife_areas: { category: "nature_wildlife_areas", label: "Nature & Wildlife Areas" },
  g_wildlife_zoos: { category: "wildlife_zoos_aquariums", label: "Wildlife, Zoos & Aquariums" },
  h_bodies_of_water: { category: "bodies_of_water", label: "Bodies of Water" },
  i_ayurveda_spas: { category: "ayurveda_spas", label: "Ayurveda & Spas" },
  j_specialty_gift_shops: { category: "specialty_gift_shops", label: "Specialty & Gift Shops" },
  k_theme_parks_museums: { category: "art_galleries_theme_parks", label: "Art Galleries & Theme Parks" },
};

/**
 * The 4 AI-generated attraction images (per the spec). Matched by file basename
 * (without extension). Everything else under attractions/ defaults to wikimedia.
 */
const AI_GENERATED_ATTRACTIONS = new Set([
  "neelimala_viewpoint",
  "panchatheertham",
  "pottery_decor",
  "meppadi_glass_bridge",
]);

/**
 * Display-name overrides for specific attraction ids (`<category>__<basename>`).
 * The default display name is `titleCase(basename)`, which cannot express
 * punctuation (commas, periods). Use this map when the client wants an exact
 * label that differs from the filename-derived one. The override flows into
 * both the `name` and the derived `alt` text; the source filename, id, src
 * path, and attribution key are unchanged.
 */
const ATTRACTION_NAME_OVERRIDES = {
  religious_sites__latin_church_wayanad: "St. Jude Church, Chundale",
  religious_sites__valliyoorkkavu: "Valliyoorkavu Temple",
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** "building_night_hero" → "Building Night Hero". */
function titleCase(basename) {
  return basename
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function listImages(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && IMAGE_EXTS.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/** True when `out` exists and is at least as new as `src` (skip re-encode). */
async function isFresh(src, out) {
  try {
    const [s, o] = await Promise.all([fs.stat(src), fs.stat(out)]);
    return o.mtimeMs >= s.mtimeMs;
  } catch {
    return false;
  }
}

/** Web path served from `public/` (strip the leading public dir). */
function webPath(absUnderPublic) {
  const rel = path.relative(path.join(ROOT, "public"), absUnderPublic);
  return "/" + rel.split(path.sep).join("/");
}

/**
 * Probe + encode one source image into responsive variants.
 * Returns { width, height, widths, sources, src } describing the outputs.
 */
async function processImage(srcAbs, outDirAbs, basename, counters) {
  const pipeline = sharp(srcAbs, { failOn: "none" });
  const meta = await pipeline.metadata();
  let width = meta.width ?? 0;
  let height = meta.height ?? 0;
  // EXIF orientations 5–8 swap the logical dimensions.
  if (typeof meta.orientation === "number" && meta.orientation >= 5) {
    [width, height] = [height, width];
  }
  if (!width || !height) {
    throw new Error(`Could not read dimensions for ${srcAbs}`);
  }

  let widths = TARGET_WIDTHS.filter((w) => w <= width);
  if (widths.length === 0) widths = [width]; // image smaller than 400px wide

  await ensureDir(outDirAbs);

  const sources = [];
  let jpegSrc = null;

  for (const fmt of FORMATS) {
    const srcsetParts = [];
    for (const w of widths) {
      const outName = `${basename}-${w}.${fmt.ext}`;
      const outAbs = path.join(outDirAbs, outName);
      if (await isFresh(srcAbs, outAbs)) {
        counters.skipped += 1;
      } else {
        const base = sharp(srcAbs, { failOn: "none" }).rotate(); // bake EXIF orientation
        await fmt
          .encode(base.resize({ width: w, withoutEnlargement: true }))
          .toFile(outAbs);
        counters.encoded += 1;
      }
      srcsetParts.push(`${webPath(outAbs)} ${w}w`);
      if (fmt.ext === "jpg" && w === widths[widths.length - 1]) {
        jpegSrc = webPath(outAbs);
      }
    }
    sources.push({ type: fmt.mime, srcSet: srcsetParts.join(", ") });
  }

  return { width, height, widths, sources, src: jpegSrc };
}

// ---------------------------------------------------------------------------
// TS module emission
// ---------------------------------------------------------------------------

const GEN_HEADER = `/**
 * ⚠️  GENERATED FILE — DO NOT EDIT BY HAND.
 * ---------------------------------------------------------------------------
 * Produced by \`scripts/build-assets.mjs\` (task 5.1). Re-run \`npm run build:assets\`
 * to regenerate. Edits here are overwritten on the next build.
 *
 * Feature: kaivalyam-homestay-website
 */`;

/** Serialize a value as a TS literal (JSON is valid TS for plain data). */
function lit(value) {
  return JSON.stringify(value, null, 2);
}

async function writeFileLogged(absPath, contents, written) {
  await ensureDir(path.dirname(absPath));
  await fs.writeFile(absPath, contents.endsWith("\n") ? contents : contents + "\n", "utf8");
  written.push(path.relative(ROOT, absPath));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function loadAttribution() {
  try {
    const raw = await fs.readFile(ATTRIBUTION_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function placeholderAttribution(id) {
  return {
    author: "TODO: attribution author — set in task 5.2",
    licenseName: "TODO: license name — set in task 5.2",
    licenseUrl: "https://example.invalid/license-todo-5.2",
    sourceUrl: "https://example.invalid/source-todo-5.2",
    title: `TODO source title for ${id}`,
  };
}

async function main() {
  const counters = { encoded: 0, skipped: 0 };
  const written = [];
  const variantMap = {}; // id -> ResponsiveVariants
  const attributionData = await loadAttribution();
  let placeholderCount = 0;

  // ---- Property photos → PhotoCatalog -------------------------------------
  const photosByCategory = new Map(PHOTO_CATEGORIES.map((c) => [c.id, []]));
  const perFolderCounts = {};

  for (const folder of Object.keys(PROPERTY_FOLDER_TO_CATEGORY)) {
    const categoryId = PROPERTY_FOLDER_TO_CATEGORY[folder];
    const srcDir = path.join(SRC_PROPERTY, folder);
    const files = await listImages(srcDir);
    perFolderCounts[`property/${folder}`] = files.length;
    for (const file of files) {
      const ext = path.extname(file);
      const basename = path.basename(file, ext);
      const id = `${categoryId}__${basename}`;
      const outDir = path.join(OUT_PUBLIC, "property", categoryId);
      const r = await processImage(path.join(srcDir, file), outDir, basename, counters);
      variantMap[id] = {
        id,
        src: r.src,
        width: r.width,
        height: r.height,
        widths: r.widths,
        sources: r.sources,
        sizes: categoryId === HERO_CATEGORY ? "100vw" : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
      };
      const photo = {
        id,
        src: r.src,
        alt: `${titleCase(basename)} — Kaivalyam Homestay, Padichira, Wayanad`,
        width: r.width,
        height: r.height,
        source: "owned",
        category: categoryId,
      };
      photosByCategory.get(categoryId).push(photo);
    }
  }

  const photoCatalog = {
    categories: PHOTO_CATEGORIES.map((c, index) => ({
      id: c.id,
      label: c.label,
      order: index,
      photos: photosByCategory.get(c.id),
    })),
  };
  const heroPhotos = photosByCategory.get(HERO_CATEGORY);

  // ---- Attractions → AttractionItem[] -------------------------------------
  const attractions = [];

  for (const folder of Object.keys(ATTRACTION_FOLDER_MAP)) {
    const map = ATTRACTION_FOLDER_MAP[folder];
    const srcDir = path.join(SRC_ATTRACTIONS, folder);
    const files = await listImages(srcDir);
    perFolderCounts[`attractions/${folder}`] = files.length;
    for (const file of files) {
      const ext = path.extname(file);
      const basename = path.basename(file, ext);
      const id = `${map.category}__${basename}`;
      const name = ATTRACTION_NAME_OVERRIDES[id] ?? titleCase(basename);
      const source = AI_GENERATED_ATTRACTIONS.has(basename) ? "ai-generated" : "wikimedia";
      const outDir = path.join(OUT_PUBLIC, "attractions", folder);
      const r = await processImage(path.join(srcDir, file), outDir, basename, counters);

      variantMap[id] = {
        id,
        src: r.src,
        width: r.width,
        height: r.height,
        widths: r.widths,
        sources: r.sources,
        sizes: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
      };

      const image = {
        id,
        src: r.src,
        alt: `${name} — ${map.label} near Kaivalyam Homestay, Wayanad`,
        width: r.width,
        height: r.height,
        source,
      };
      if (source === "wikimedia") {
        const attr = attributionData[id];
        if (attr && typeof attr === "object") {
          image.attribution = attr;
        } else {
          image.attribution = placeholderAttribution(id);
          placeholderCount += 1;
        }
      }

      const item = { id, name, category: map.category, image };
      if (map.subgroup) item.subgroup = map.subgroup;
      attractions.push(item);
    }
  }

  // ---- Emit generated TS modules ------------------------------------------
  await ensureDir(OUT_GENERATED);

  const variantsModule = `${GEN_HEADER}

import type { ImageVariantMap } from "@/content/image-pipeline";

/** Responsive AVIF/WebP/JPEG variants for every generated image, keyed by id. */
export const imageVariants: ImageVariantMap = ${lit(variantMap)};
`;
  await writeFileLogged(path.join(OUT_GENERATED, "image-variants.ts"), variantsModule, written);

  const photoModule = `${GEN_HEADER}

import type { Photo, PhotoCatalog } from "@/content/types";

/** The full gallery catalog grouped into the 9 canonical categories (Req 6.1). */
export const photoCatalog: PhotoCatalog = ${lit(photoCatalog)};

/**
 * Home hero candidates — the \`night_ambiance\` photos (Req 2.1). Exported
 * separately (rather than flagged on each Photo) so the generated data conforms
 * exactly to the \`Photo\` type, which has no \`isHero\` field.
 */
export const heroPhotos: Photo[] = ${lit(heroPhotos)};

/** Ids of the hero candidates, for quick membership checks. */
export const heroPhotoIds: readonly string[] = ${lit(heroPhotos.map((p) => p.id))};
`;
  await writeFileLogged(path.join(OUT_GENERATED, "photo-catalog.ts"), photoModule, written);

  const attractionsModule = `${GEN_HEADER}

import type { AttractionItem } from "@/content/types";

/**
 * The local-attractions directory (Req 7.1, 7.5). Religious-sites items carry a
 * \`subgroup\` (Hindu/Jain/Christian/Muslim); all others omit it, per the
 * \`AttractionItem\` discriminated union.
 *
 * \`source\` tagging: property photos are owned; attraction images default to
 * \`wikimedia\` (attribution required) except the 4 AI-generated images. The
 * \`wikimedia\` attribution objects below are placeholders until task 5.2
 * authors the real license data and adds the build-fail validator.
 */
export const attractions: AttractionItem[] = ${lit(attractions)};
`;
  await writeFileLogged(path.join(OUT_GENERATED, "attractions.ts"), attractionsModule, written);

  const indexModule = `${GEN_HEADER}

export { imageVariants } from "./image-variants";
export { photoCatalog, heroPhotos, heroPhotoIds } from "./photo-catalog";
export { attractions } from "./attractions";
`;
  await writeFileLogged(path.join(OUT_GENERATED, "index.ts"), indexModule, written);

  // ---- Report -------------------------------------------------------------
  const totalImages = Object.keys(variantMap).length;
  console.log("\nKaivalyam asset pipeline (task 5.1) complete.");
  console.log(`  Images processed : ${totalImages}`);
  console.log(`  Variants encoded : ${counters.encoded} (skipped fresh: ${counters.skipped})`);
  console.log(`  Photo categories : ${photoCatalog.categories.length}  (heroes: ${heroPhotos.length})`);
  console.log(`  Attractions      : ${attractions.length}`);
  if (placeholderCount > 0) {
    console.log(
      `  ⚠ wikimedia attribution placeholders: ${placeholderCount} — task 5.2 must fill scripts/asset-data/attribution.json + add the validator.`,
    );
  }
  console.log("  Per-folder counts:");
  for (const key of Object.keys(perFolderCounts)) {
    console.log(`    ${key}: ${perFolderCounts[key]}`);
  }
  console.log("  Generated modules:");
  for (const w of written) console.log(`    ${w}`);
}

main().catch((err) => {
  console.error("Asset pipeline failed:", err);
  process.exitCode = 1;
});
