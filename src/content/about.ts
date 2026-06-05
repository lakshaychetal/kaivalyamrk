/**
 * About content collection — the Kaivalyam philosophy and Wayanad story.
 * ----------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 4.2)
 *
 * Authors the narrative content for the About page (task 11.2):
 *   • the meaning of "Kaivalyam" — liberation and solitude of the soul (Req 3.1)
 *   • the pet-friendly, long-stay positioning (Req 3.2)
 *   • the Wayanad region story (Req 3.3)
 *   • the signature offerings (Req 3.4)
 *
 * `content/types.ts` does not (intentionally) define an About shape — the About
 * page is prose, not a catalog — so the typed structures for this narrative are
 * declared here and exported for the page to consume. No React, no side
 * effects; plain typed data so it compiles under strict mode and can be
 * rendered by SSG.
 *
 * Illustrative property photos (Req 3.5) are wired in by the About page from the
 * asset pipeline (task 5.1); none are fabricated here.
 *
 * _Requirements: 3.1, 3.2, 3.3, 3.4_
 */

/** A titled prose section of the About narrative. */
export interface AboutSection {
  /** Stable id for anchors/keys. */
  id: string;
  /** Section heading. */
  heading: string;
  /** One or more paragraphs of prose, in order. */
  paragraphs: string[];
}

/** A single signature offering (Req 3.4), with a Lucide icon name (Req 19.4). */
export interface SignatureOffering {
  id: string;
  title: string;
  description: string;
  /** Lucide icon name (single icon family, Req 19.4). */
  icon: string;
}

/** The full typed About-page content model. */
export interface AboutContent {
  /** Brand tagline echoed on the page. */
  tagline: string;
  /** The meaning of "Kaivalyam" (Req 3.1). */
  meaning: AboutSection;
  /** Pet-friendly, long-stay positioning (Req 3.2). */
  positioning: AboutSection;
  /** The Wayanad region story (Req 3.3). */
  wayanadStory: AboutSection;
  /** Signature offerings (Req 3.4). */
  signatureOfferings: SignatureOffering[];
}

/** The brand tagline (Req 2.2 / brand voice), reused on the About page. */
export const TAGLINE = 'EXPERIENCE SERENE SOLITUDE #KAIVALYAM' as const;

/**
 * The meaning of "Kaivalyam" — liberation and solitude of the soul (Req 3.1).
 */
export const meaning: AboutSection = {
  id: 'meaning',
  heading: 'The Meaning of Kaivalyam',
  paragraphs: [
    'Kaivalyam is an old word for liberation — the deep, settled solitude of the soul that comes when the noise finally falls away. It names a kind of freedom that is not about going anywhere, but about arriving fully where you are.',
    'We built this homestay around that idea. No rush, no crowds, no performance — just clear hill air, the green hush of Wayanad, and the space to feel like yourself again. To stay at Kaivalyam is to experience serene solitude, on your own terms.',
  ],
};

/**
 * Pet-friendly, tranquil hill-village positioning, suited to long stays
 * (Req 3.2).
 */
export const positioning: AboutSection = {
  id: 'positioning',
  heading: 'A Tranquil Home for Long, Slow Stays',
  paragraphs: [
    'Kaivalyam is a tranquil hill-village homestay in Padichira, Wayanad — a quiet place made for people who want to stay a while. Days here are unhurried by design: long mornings, slow meals, walks that go nowhere in particular. It suits long-staying guests who are looking for calm rather than a checklist.',
    'Come for a few restful days or a long, restorative season — the door is open either way.',
  ],
};

/**
 * The Wayanad region story — natural and cultural setting (Req 3.3).
 */
export const wayanadStory: AboutSection = {
  id: 'wayanad-story',
  heading: 'The Land of Paddy Fields',
  paragraphs: [
    'Wayanad takes its name from Vayal Nadu — the "land of paddy fields" — and the description still fits. This is a high plateau in the Western Ghats, a tapestry of emerald paddy, spice and coffee plantations, misty peaks, and forest that shelters some of South India\u2019s richest wildlife.',
    'It is also a deeply layered cultural landscape, home to ancient tribal communities whose traditions are woven into the hills, alongside temples, old trade routes, and quiet villages like ours. To be in Wayanad is to feel nature and heritage breathing together — and Kaivalyam sits gently in the middle of it, in Padichira, about ten kilometres from Pulpally.',
  ],
};

/**
 * The signature offerings (Req 3.4): guided tours, nature walks, local
 * community interaction, and 24-hour guest assistance.
 */
export const signatureOfferings: SignatureOffering[] = [
  {
    id: 'guided-tours',
    title: 'Guided Tours',
    description:
      'Explore Wayanad with people who know it — guided trips to the waterfalls, peaks, caves, and heritage sites scattered across the region.',
    icon: 'map',
  },
  {
    id: 'nature-walks',
    title: 'Nature Walks',
    description:
      'Peaceful walks through plantations and greenery that begin right at the homestay, at a pace that lets you actually notice where you are.',
    icon: 'footprints',
  },
  {
    id: 'community-interaction',
    title: 'Local Community Interaction',
    description:
      'Meet the people and traditions of the hills — a warm, genuine window into Wayanad\u2019s tribal culture and village life.',
    icon: 'users',
  },
  {
    id: '24-hour-assistance',
    title: '24-Hour Guest Assistance',
    description:
      'Whatever you need, whenever you need it — our team is on hand around the clock so your stay stays effortless.',
    icon: 'clock',
  },
];

/** The assembled About-page content, ready for the page to render. */
export const aboutContent: AboutContent = {
  tagline: TAGLINE,
  meaning,
  positioning,
  wayanadStory,
  signatureOfferings,
};
