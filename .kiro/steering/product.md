# Product

## Kaivalyam Homestay Website

A professional, responsive marketing-and-booking website for **Kaivalyam Homestay** — a pet-friendly, tranquil hill-village homestay in Padichira, Wayanad, Kerala, India (about 10 km from Pulpally).

**Brand tagline:** "EXPERIENCE ULTIMATE SOLITUDE #KAIVALYAM"

The name "Kaivalyam" means liberation and solitude of the soul. The brand voice is calm, natural, and warm, emphasizing seclusion, nature immersion, and long-stay hospitality.

## Two Core Jobs

1. **Market the experience** — image-led content pages (Home, About, Rooms, Facilities, Gallery, Attractions, Cuisine, Contact, Reach Us) that communicate the brand philosophy.
2. **Convert visitors into guests** — an embedded booking engine, online payments, and WhatsApp booking assistance.

## Accommodation

- **Luxury Cottage** — duplex with attached bathroom, roof balcony and sit-out, indoor play area, private laundry, and gazebo.
- **Classic Room** — affordable, cozy room with essential amenities.

## Third-Party Integrations

The site builds **no** booking, inventory, channel, or payment logic itself — these are delegated to external platforms behind a thin integration layer:

- **eeabsolute.com** — booking engine, Property Management System (PMS), and channel manager.
- **Razorpay** — payment gateway (invoked inside the eeabsolute booking flow).
- **WATI** — WhatsApp click-to-chat and consent-gated booking notifications.
- **Google Analytics 4** — plus a first-party analytics store for the cumulative visit counter and booking billing surfaced in an authenticated admin report.

## Non-Negotiable Quality Bars

These are first-class product requirements, not nice-to-haves:

- **Accessibility:** WCAG 2.1 AA — 4.5:1 text contrast, keyboard navigation, focus indicators, alt text on every meaningful image, reduced-motion support.
- **Performance:** modern image formats (AVIF/WebP), lazy loading, CLS < 0.1.
- **Responsive:** mobile-first, no horizontal scroll at ≥375px, 44×44px touch targets.
- **SEO:** unique title/meta per page, structured data (LodgingBusiness), sitemap/robots.
- **Image attribution:** Wikimedia-sourced images require credits on the Photo Credits page; owned/AI-generated images do not.

## Audience

- **Visitor** — anyone browsing the public site.
- **Guest** — a visitor who checks availability, books, or pays.
- **Administrator** — staff who view analytics and manage content/bookings.
