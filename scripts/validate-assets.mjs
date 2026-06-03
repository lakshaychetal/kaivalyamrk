/**
 * Build-fail asset validator (task 5.2).
 * ===========================================================================
 * Feature: kaivalyam-homestay-website
 *
 * Loads the GENERATED catalog produced by `scripts/build-assets.mjs`
 * (`src/content/generated/photo-catalog.ts` + `attractions.ts`) and FAILS THE
 * BUILD (non-zero exit) if any image is non-compliant. This enforces, before
 * any code ships, the alt-text and attribution correctness properties
 * (Properties 4 & 6) at the data layer.
 *
 * Violation rules (any one fails the build):
 *   (a) MISSING ALT — any property photo OR attraction image has an empty or
 *       whitespace-only `alt`.                          (Req 6.7, 7.6, 22.2)
 *   (b) INCOMPLETE WIKIMEDIA ATTRIBUTION — any image with `source === 'wikimedia'`
 *       is missing `attribution`, or has an empty/whitespace `author`,
 *       `licenseName`, `licenseUrl`, or `sourceUrl`, or still uses a PLACEHOLDER
 *       (the `example.invalid` host, or a "TODO" marker).   (Req 23.1, 23.4)
 *   (c) UNEXPECTED ATTRIBUTION — any `owned`/`ai-generated` image carries an
 *       `attribution` (attribution is for Wikimedia ONLY).        (Req 23.3)
 *
 * The catalog modules emit their data as `JSON.stringify` literals, so this
 * validator extracts and parses those literals directly (no TS loader needed),
 * keeping the validator independent of the app's bundler/runtime.
 *
 * Usage:
 *   node scripts/validate-assets.mjs        # validate (run after build:assets)
 *   npm run validate:assets                 # same, via package script
 *   npm run build:assets                    # regenerate THEN validate
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GEN_DIR = path.join(ROOT, "src", "content", "generated");
const PHOTO_CATALOG_FILE = path.join(GEN_DIR, "photo-catalog.ts");
const ATTRACTIONS_FILE = path.join(GEN_DIR, "attractions.ts");

/** Host used by the task-5.1 TODO placeholders — a placeholder detection hook. */
const PLACEHOLDER_HOST = "example.invalid";
/** Marker text left in placeholder attribution fields. */
const PLACEHOLDER_MARKER = "TODO";

// ---------------------------------------------------------------------------
// Literal extraction — pull the JSON value assigned to a named export.
// ---------------------------------------------------------------------------

/**
 * Extract the JSON literal assigned to `export const <name>...= <literal>;`.
 * Scans from the first `{`/`[` after the marker to its matching close,
 * respecting string contents (so braces inside strings don't confuse it).
 */
function extractLiteral(source, exportName) {
  const markerRe = new RegExp(`export const ${exportName}\\b[^=]*=\\s*`);
  const m = markerRe.exec(source);
  if (!m) {
    throw new Error(`Could not find "export const ${exportName}" in generated module.`);
  }
  let i = m.index + m[0].length;
  const openCh = source[i];
  if (openCh !== "{" && openCh !== "[") {
    throw new Error(`Expected a JSON object/array literal for "${exportName}".`);
  }
  const closeCh = openCh === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  const startsArray = openCh === "[";
  // Track both braces and brackets generically.
  for (let j = i; j < source.length; j++) {
    const ch = source[j];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        const slice = source.slice(i, j + 1);
        return JSON.parse(slice);
      }
    }
  }
  throw new Error(
    `Unterminated ${startsArray ? "array" : "object"} literal for "${exportName}".`,
  );
}

async function readGenerated(file, exportName) {
  let source;
  try {
    source = await fs.readFile(file, "utf8");
  } catch {
    throw new Error(
      `Generated module not found: ${path.relative(ROOT, file)}\n` +
        `Run \`npm run build:assets\` first to generate the catalog.`,
    );
  }
  return extractLiteral(source, exportName);
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const isBlank = (v) => typeof v !== "string" || v.trim().length === 0;

const isPlaceholder = (v) =>
  typeof v === "string" &&
  (v.includes(PLACEHOLDER_HOST) || v.includes(PLACEHOLDER_MARKER));

const ATTRIBUTION_REQUIRED_FIELDS = [
  "author",
  "licenseName",
  "licenseUrl",
  "sourceUrl",
];

/**
 * Validate a single image asset. `where` describes its location (for the
 * report). Pushes human-readable strings into `violations`.
 */
function validateImage(image, where, violations) {
  const id = image?.id ?? "(unknown id)";
  const tag = `${where} [${id}]`;

  // Rule (a): non-empty alt for every image.
  if (isBlank(image?.alt)) {
    violations.push(`${tag}: empty/whitespace alt text (Req 6.7, 7.6, 22.2).`);
  }

  const source = image?.source;
  const attribution = image?.attribution;

  if (source === "wikimedia") {
    // Rule (b): complete, non-placeholder attribution for wikimedia images.
    if (!attribution || typeof attribution !== "object") {
      violations.push(
        `${tag}: source 'wikimedia' but attribution is missing (Req 23.1, 23.4).`,
      );
      return;
    }
    for (const field of ATTRIBUTION_REQUIRED_FIELDS) {
      const value = attribution[field];
      if (isBlank(value)) {
        violations.push(
          `${tag}: attribution.${field} is empty (Req 23.1, 23.4).`,
        );
      } else if (isPlaceholder(value)) {
        violations.push(
          `${tag}: attribution.${field} is still a TODO placeholder ("${value}") — author real Wikimedia data (Req 23.1, 23.4).`,
        );
      }
    }
    // `title` is optional, but if present it must not be a leftover placeholder.
    if (attribution.title !== undefined && isPlaceholder(attribution.title)) {
      violations.push(
        `${tag}: attribution.title is still a TODO placeholder (Req 23.1, 23.4).`,
      );
    }
  } else {
    // Rule (c): owned / ai-generated images must NOT carry attribution.
    if (attribution !== undefined) {
      violations.push(
        `${tag}: source '${source}' must NOT carry attribution (Req 23.3 — attribution is for Wikimedia only).`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const violations = [];
  const stats = {
    photos: 0,
    attractions: 0,
    wikimedia: 0,
    aiGenerated: 0,
    owned: 0,
  };

  // ---- Property photo catalog ---------------------------------------------
  const photoCatalog = await readGenerated(PHOTO_CATALOG_FILE, "photoCatalog");
  for (const category of photoCatalog.categories ?? []) {
    for (const photo of category.photos ?? []) {
      stats.photos += 1;
      if (photo.source === "wikimedia") stats.wikimedia += 1;
      else if (photo.source === "ai-generated") stats.aiGenerated += 1;
      else if (photo.source === "owned") stats.owned += 1;
      validateImage(photo, `gallery/${category.id}`, violations);
    }
  }

  // ---- Attractions --------------------------------------------------------
  const attractions = await readGenerated(ATTRACTIONS_FILE, "attractions");
  for (const item of attractions ?? []) {
    stats.attractions += 1;
    const image = item.image;
    if (image?.source === "wikimedia") stats.wikimedia += 1;
    else if (image?.source === "ai-generated") stats.aiGenerated += 1;
    else if (image?.source === "owned") stats.owned += 1;
    validateImage(image, `attraction/${item.category}`, violations);
  }

  // ---- Report -------------------------------------------------------------
  const totalImages = stats.photos + stats.attractions;
  console.log("\nKaivalyam asset validation (task 5.2)");
  console.log(`  Images checked   : ${totalImages} (${stats.photos} gallery photos, ${stats.attractions} attractions)`);
  console.log(`  By source        : ${stats.wikimedia} wikimedia, ${stats.aiGenerated} ai-generated, ${stats.owned} owned`);

  if (violations.length > 0) {
    console.error(`\n  ✗ ${violations.length} violation(s) — FAILING THE BUILD:\n`);
    for (const v of violations) console.error(`    • ${v}`);
    console.error(
      "\n  Fix: ensure every image has non-empty alt; every 'wikimedia' image has\n" +
        "  complete, non-placeholder attribution in scripts/asset-data/attribution.json;\n" +
        "  and no owned/ai-generated image carries attribution.\n",
    );
    process.exitCode = 1;
    return;
  }

  console.log("\n  ✓ All images have non-empty alt text.");
  console.log("  ✓ All Wikimedia images have complete, non-placeholder attribution.");
  console.log("  ✓ No owned/AI-generated image carries attribution.");
  console.log("  Asset validation passed.\n");
}

main().catch((err) => {
  console.error("\nAsset validation crashed:", err.message ?? err);
  process.exitCode = 1;
});
