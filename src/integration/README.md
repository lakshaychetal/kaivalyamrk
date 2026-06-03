# `integration/` — Third-party adapters

The only place that touches third-party vendors. Typed wrappers for
eeabsolute.com (booking / PMS / channel manager), Razorpay-in-flow, WATI
(WhatsApp), and analytics (GA4 + first-party).

Depends on `domain/` for pure logic (e.g. URL building); the rest of the app
depends on these stable interfaces, never on vendor specifics. The site builds
no booking / PMS / channel / payment logic.

Secrets (WATI, eeabsolute credentials) stay server-side and are never shipped
to the client.

Populated from task 14.1 onward.
