---
version: 1
slug: "chat-launcher"
primary_target: "components/reader/chat-launcher.tsx"
related_targets: ["components/public-nav.tsx", "components/reader/reader-app.tsx", "components/reader/reader.css"]
---

# Tama chatbot launcher
Mode: Operate. Narrow extension of public maroon/glass identity, using the user's pinned Tama mascot reference. Code-led; no new world or comp round.

## Direction contract
THESIS: Tama is the recognizable invitation to ask about the reading collection.
OWN-WORLD: user's orange-beaked black/white hornbill, green/purple Tama sash, brown mathematics book; public maroon and white glass controls.
STORY: notice Tama at lower right → press → ask in the attached panel → close and return to reading.
FIRST VIEWPORT: transparent 3D Tama cutout and compact labelled button fixed lower right; chat remains closed until pressed, then anchors directly above. Responsive safe-area spacing.
FORM: user-pinned mascot cutout and existing conversation panel, not a new page composition.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion
Focal: two slow, small greeting rocks on first display, then rest; a brief greeting on hover/focus. Continuity: chat grows from its lower-right anchor with a short ease-out. Feedback: button label changes when open. Budget: CSS transforms/opacity only, bounded animation; reduced-motion removes the greeting and spatial entrance. Hidden documents pause motion.

## Shipped system record — 7 November 2026

Narrow code-led extension of the existing public/reader identity; no approved comp or new quality bar was introduced. Root `DESIGN.md` and `.impeccable/design.json` retain the established admin and reader system and record the Tama identity, bounded CSS motion, nonmodal behavior, and responsive anchoring.

Implementation: `components/reader/chat-launcher.tsx`, the Tama/catalog chat rules in `components/reader/reader.css`, and the scoped book assistant icon in `components/reader/reader-app.tsx`. The source is a transparent 3D-rendered PNG animated with CSS, not a WebGL or skeletal model. Initial chat is closed. The trigger opens/toggles the labelled nonmodal panel; opening focuses its close control, Escape closes with focus return, and outside interaction permits continued page use without dismissing the conversation. Reader chat remains scoped to its existing panel behavior.

### Asset provenance

`public/mascots/tama-chat.png` is authored identity artwork generated with built-in `image_gen` from the user's pinned Tama hornbill reference. `docs/assets/tama-chat.json` retains the exact embedded prompt, source name, tool, and reference SHA-256 (`bf78c43b620e541e09cea6ff30dc7ca7d9e11b3c5743cbae8cfbc9523a67ee7f`). Keep the source PNG alpha; Next Image generates optimized derivatives. The tested 256px WebP derivative was 13,362 bytes. The asset scan found one shipping raster and zero missing provenance records. This is distinct from runtime PDF pages: those remain document content rather than design-system artwork.

### Review and validation evidence

The bounded finish review returned **ship at the scope of this existing-identity extension**, retained all direction-contract commitments, and found no material fixes. This does not extend approval to unrelated pages or live AI quality. Reviewed, opened, and valid captures: `.impeccable/review/tama-desktop-closed.png`, `tama-desktop-open.png` (1280×720), `tama-mobile-closed.png`, `tama-mobile-open.png` (390×844), `tama-reader-desktop.png`, `tama-reader-mobile.png`, and `tama-compact-open.png` (390×400).

Behavior checks covered initial closed state, click toggling, Enter, Escape with focus return, continued page interaction behind the nonmodal panel, responsive panel fitting, and reduced-motion rules. The panel is 390px wide on desktop, fits the viewport below 768px, and uses a near-full-height presentation at viewport heights ≤540px. Greeting motion uses two 2.2s cycles after 0.6s, one 1.2s hover/focus greeting, then rest; launcher motion pauses when chat is open or the document is hidden. Reduced motion removes greeting and panel entrance.

Live DeepSeek activation remains unchanged and inactive per the user's configuration-first choice. This extension does not certify live answer quality.

Not canonized: small auxiliary 9–11px metadata remains secondary rather than a body-copy standard; no runtime 3D model, perpetual mascot loop, or new interface palette is inferred from the identity raster.
