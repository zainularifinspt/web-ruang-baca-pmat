---
name: Ruang Baca PMat
description: Public maroon glass identity with focused workspace and reading extensions.
colors:
  primary: "#b91c1c"
  primary-foreground: "#ffffff"
  background: "#f8fafc"
  foreground: "#0f172a"
  muted: "#f1f5f9"
  muted-foreground: "#64748b"
  border: "#e2e8f0"
  input: "#cbd5e1"
  admin-maroon: "#57162e"
  admin-ink: "#292638"
  admin-canvas: "#f7f6fa"
  admin-glass: "#ffffffc9"
  metric-rose: "#b7345e"
  metric-rose-surface: "#fce8ee"
  metric-violet: "#7f45b5"
  metric-violet-surface: "#eee5fc"
  metric-teal: "#237d79"
  metric-teal-surface: "#def2ee"
  metric-amber: "#95621e"
  metric-amber-surface: "#fcf0d8"
  reader-support: "#65576e"
  reader-line: "#e7e0e8"
  reader-panel: "#fcfafd"
typography:
  headline:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "14px"
  label:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  metric:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  reader-panel-title:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    letterSpacing: "-0.02em"
  reader-copy:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "12px"
    lineHeight: 1.9
rounded:
  control: "12px"
  button: "10px"
  status: "6px"
  admin-panel: "21px"
  admin-card: "20px"
  public-card: "1.5rem"
  reader-message: "14px"
  reader-field: "11px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  workspace: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    height: "40px"
    padding: "8px 16px"
    rounded: "10px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    height: "40px"
    padding: "8px 16px"
    rounded: "10px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    height: "40px"
    padding: "8px 12px"
    rounded: "{rounded.control}"
  admin-section:
    backgroundColor: "{colors.admin-glass}"
    rounded: "{rounded.admin-panel}"
  admin-status:
    backgroundColor: "#f0f4f5"
    textColor: "#52686c"
    rounded: "{rounded.status}"
    padding: "4px 7px"
  reader-search-field:
    backgroundColor: "{colors.primary-foreground}"
    textColor: "{colors.reader-support}"
    rounded: "{rounded.reader-field}"
    padding: "12px"
  reader-message:
    backgroundColor: "#f1ebf5"
    typography: "{typography.reader-copy}"
    rounded: "{rounded.reader-message}"
    padding: "14px"
  tama-launcher-label:
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
    width: "112px"
---

# Design System: Ruang Baca PMat

## Overview

**Creative North Star: "PMat mathematical geometry"**

PMat mathematical geometry is the inherited visual anchor: the ULM identity, maroon fields, Plus Jakarta Sans, and luminous white glass connect the public portal and internal workspace. The admin extension uses compact type, pale colored surfaces, and controlled shadows to keep operational content readable.

This record describes the shipped admin and reader extensions and their shared primitives. The public landing and catalog remain the visual authority for the established identity; this documentation does not declare those pages redesigned. Route composition and validation evidence live in the dashboard, flipbook, and chat launcher surface briefs. The reader carries the public maroon and glass into a quiet paper stage; search and cited answers support the document rather than competing with it. Tama extends the assistant identity with the user-pinned hornbill artwork, while its controls retain the existing maroon and pale glass materials.

**Key Characteristics:**
- Maroon identity with rose, violet, teal, and amber category accents.
- Frosted white panels, specular edges, and softly rounded controls.
- Strong numeric hierarchy and compact operational typography.
- Mathematical glass geometry with restrained hover motion.
- Neutral document paper, compact glass reader controls, and evidence-linked support panels.
- Recognizable Tama identity artwork with a short greeting that comes to rest.

## Colors

Maroon and white glass establish continuity; the admin adds pale category tints against a lavender, rose, and mint washed canvas. The frontmatter holds the normative values; admin colors are scoped roles, not replacements for root primitives.

### Primary
- **Public crimson:** shared primary controls and existing portal identity.
- **Admin maroon:** navigation and welcome framing; gradient variants deepen toward plum.

### Secondary
- **Metric rose / violet / teal / amber:** book collections, theses, today's visits, and seven-day visits respectively. Use their paired pale surfaces in metric cards. Shortcut and chart colors use related, context-specific shades rather than a single universal semantic ramp.

### Neutral
- **Background / foreground:** inherited control surfaces and strong text.
- **Muted / muted foreground:** supporting information and secondary surfaces.
- **Border / input:** inherited field and divider strokes.
- **Admin ink / canvas / glass:** internal text, ambient backdrop, and data panels.
- **Reader support / line / panel:** readable plum-gray supporting copy, fine control strokes, and pale reading-support panels. Reader controls use maroon gradients; page images retain their original document colors. These scoped roles extend the public identity.

**The Inherited Identity Rule.** Keep maroon, Plus Jakarta Sans, and the ULM identity recognizable across public and internal surfaces. Scope internal overrides to the admin workspace and its drawer.

**The Label Alongside Color Rule.** Category colors accompany visible labels, icons, and values; they do not carry meaning alone.

## Typography

**Display Font:** Plus Jakarta Sans (sans-serif fallback).
**Body Font:** Plus Jakarta Sans (sans-serif fallback), loaded by the root layout with swap behavior.

**Character:** One geometric sans family connects the mathematical public identity and dense internal work. Hierarchy comes from weight, size, spacing, and tabular figures rather than a second typeface. The admin is not a strict ratio-based type scale.

### Hierarchy
- **Headline:** admin welcome and page headings use heavy, tightly tracked type; the welcome becomes 25px on mobile. Content headings use 26px, becoming 24px on mobile.
- **Title:** titled admin sections resolve to the compact title role, with semantic h2 headings.
- **Body:** internal content and table text use the body role; descriptions and secondary rows commonly step down to 12px.
- **Label:** navigation and metric labels use the label role; metric labels increase to 14px from 640px.
- **Metric:** extra-bold tabular figures increase from 30px to 36px at 640px. Counts use Indonesian number formatting.

Small auxiliary metadata appears below the label role in the shipped interface; retain its secondary purpose rather than using it for essential explanatory copy. Public hero typography remains independently responsive and larger.

The reader inherits the same family. Its title bar is compact (14px, 800; 12px on mobile), with truncation for long titles. Panel headings use the reader panel title role (18px on mobile). Message and search excerpts share the reader copy role. Reader metadata ranges from 9–11px; it remains auxiliary to the document and panel content.

## Layout

The desktop admin shell has a floating sidebar inset 16px, 244px wide, and a transparent account header. At 1280px the workspace reserves 276px on the left. At 1600px the sidebar grows to 258px and the offset to 290px. Main content is centered, capped at 1480px, with 28px horizontal padding, increasing to 36px at 1600px.

Below 1280px, navigation uses a labelled modal drawer with the same identity. Below 768px, workspace padding becomes 16px, panels tighten, and the compact heading retains visible cube geometry. Shared spacing follows an observed 4px-based utility rhythm, with bespoke panel padding where required. Tables own their horizontal overflow. Recent collection titles allow two lines on mobile and one from 640px.

Grid counts and story order are surface-specific; see the dashboard brief. Shared panels have a minimum width of zero so grid content can shrink without widening the page.

The reader fills the dynamic viewport and contains overflow within the paper stage and active support panel. Header height is stable at 76px, or 68px below 768px. The stage flexes between header and bottom toolbar. Desktop support panels reserve 350px, narrowing to 310px at or below 1000px. Below 768px, they become full-width bottom sheets occupying 82% of the reader body, with their own scrolling content. The inset glass dock groups page arrows and a page position indicator beside thumbnails, search, and Tama. The controls condense when the stage narrows and wrap on the smallest screens. The catalog assistant is a separate nonmodal anchored dialog (390px wide), with a viewport-fitted mobile layout. Its Tama trigger sits at the lower right with safe-area offsets (20px desktop; 12px right and 14px bottom below 768px). The open panel occupies the lower-right corner with a 20px desktop or 12px mobile bottom inset plus the safe area. Its height fits the available viewport and its message area scrolls.

## Elevation & Depth

The system combines tonal layering, backdrop blur, thin specular highlights, and diffuse shadows. Public glass cards use a white translucent fill and 20px blur. Internal data sections use a stronger white fill and 16px blur; gradients give metrics their category tone. This is ambient depth, not hard offset framing.

### Shadow Vocabulary
- **Admin panel:** `0 8px 28px -20px #40294f38, inset 0 1px 0 #fff` supports recurring data sections.
- **Metric card:** `0 8px 24px -18px #5b32694d, inset 0 1px 0 #fff` supports colored statistics.
- **Public glass:** `0 20px 40px -15px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(226, 232, 240, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)` remains the inherited public material.

The reader uses a pale rose/lavender stage, translucent white header and footer, and white document paper. The book has a diffuse drop shadow (`0 22px 20px #34233f28`); the mobile sheet has an upward shadow (`0 -18px 60px #3b254b26`). These distinguish document and support surfaces without adding decoration to page content. Tama’s rounded rendered volumes are raster artwork, with a small diffuse drop shadow (`0 7px 5px #31162030`); they are not a runtime 3D model or skeletal animation. The assistant panel uses a diffuse shadow (`0 20px 70px #43244238`).

**The Readable Glass Rule.** Use substantial white fill for data panels. Transparent faces and orbit lines belong to decorative geometry, away from operational text.

## Shapes

Soft rectangles organize work: shared controls use the control radius; admin cards and panels use the larger radii above, while the public glass card uses the public radius. Metric cards tighten to 17px on mobile. Avatars are softly squared; status tags are smaller rounded rectangles. Pills and circular geometry remain valid where already used, including public segmented controls and chart forms.

The signature cube is real CSS geometry: six translucent faces translated by half the cube size, preserve-3d transforms, perspective, and fine edge strokes. Orbits use thin circular outlines. These are decorative, hidden from assistive technology, and do not accept pointer events.

Reader controls continue the soft rectangle vocabulary: back and fullscreen controls retain the shared control radius; messages and the composer share the reader message radius. Scope and search fields use the reader field radius. Mobile panel corners round only at the top (22px); page images remain rectangular paper.

## Components

### Buttons
Shared primary controls use public crimson with white text; outline controls retain a visible input stroke and pale fill. Default height is 40px, with 8px by 16px padding and the shared 10px radius; route-level variants may round further. Hover raises standard buttons slightly, while active presses scale to 0.98. Disabled controls reduce opacity and block pointer interaction.

The welcome link is a distinct translucent white button with a fine light border, 10px by 14px padding, and a brighter hover fill. Operational shortcuts use pale white rounded surfaces and category-colored labels/icons. They brighten and gain subtle shadow on hover.

### Chips
The admin status chip uses a muted cool background, a compact rounded shape, and visible text. It is informational, not an interactive filter. Existing shared badges retain primary, secondary, and outline variants in their own contexts.

### Cards / Containers
Reusable data sections use frosted white panels without an exterior stroke in the admin. Headings and body are divided with a pale internal line. Desktop header padding is 21px 22px 17px; body padding is 17px 22px 22px. Mobile padding tightens to 19px 18px 14px and 14px 18px 18px respectively. Metric cards use a white-to-category gradient and an inset icon tile. Empty, loading, and unavailable states stay inside the same panel instead of presenting invented values.

### Inputs / Fields
Shared fields use a pale background, input stroke, 40px height, 12px horizontal padding, and an admin control radius. Disabled fields retain the shared reduced-opacity state. Admin interactive elements receive a 3px violet focus outline, offset 3px; shared controls may additionally retain their crimson focus ring. Input and textarea carets use a maroon accent.

### Navigation
The floating sidebar uses a maroon-to-plum gradient, pale text, 12px semibold labels, and 13px rounded links. Hover adds a translucent white wash; the active page gains a brighter glass fill, inset highlight, colored icon, and trailing chevron. Active links expose aria-current. Role-aware navigation and action visibility remain functional concerns, not decorative variants.

The compact account header is transparent. Mobile navigation uses a labelled dialog and closes after navigation. A focus-revealed skip link reaches the main content.

### Mathematical Glass Geometry
Static cubes connect the internal heading to public mathematical forms. Desktop heading hover changes their 3D rotation over 0.7s with `cubic-bezier(.16,1,.3,1)`. Mobile retains smaller geometry without that hover rotation; reduced motion removes admin transitions and animations. The cubes are not a general data-container treatment.

### Document Reader
The book is the principal artifact. Flipbook mode adapts between spreads and portrait pages according to available stage space. Mode halaman provides one page in a scrollable stage; theses start here, and zoom above 100% or reduced-motion preference also selects it. Zoom advances in 25% steps up to 200%; higher zoom requests the HD page asset. Only a bounded neighboring image window is retained. Page images use contain fitting and descriptive alt text. The Google Drive link opens the original PDF in a new tab.

Previous/next controls, a labelled PDF page field, and arrow keys outside editable controls provide navigation. Printed labels and source PDF numbers remain distinct. Search and citations navigate with source page/revision references. Thumbnails load in batches of 24, with three columns on desktop and four on mobile. Unavailable documents keep the reading shell and show retry/detail actions.

### Search and Reading Support
Search uses a white rounded field and separated result rows, with word-spaced excerpts that wrap long tokens. It reports the number of pages currently found and distinguishes more available results from all results displayed. Poor extracted text carries a visible warning to check the original. Search matches are translucent yellow overlays on the document, hidden from assistive technology.

### Assistant and Sources
Reader chat uses a compact Tama header and book/page scope controls with pressed states. The empty conversation shows an example question for the selected scope. Assistant messages use a pale surface, user messages use maroon, and errors use warm tints. Citation cards show the collection title and source page/label as links. New messages scroll the message container; the header stays stable. The composer remains outside that scrolling area. Busy and error responses remain visible in the panel; conversation clearing is explicitly labelled. The catalog launcher opens the same chat pattern in a labelled nonmodal dialog; page interaction remains available.

Reader controls expose a 3px rose focus outline with 3px offset. Mobile support panels are labelled modal dialogs: focus enters the panel, stays within it, returns on close, and background header/main content become inert. Search results and citations close the mobile panel when they navigate to a page. Reduced motion selects static page mode and removes zoom transitions and thinking/spinner animations.

**The Source Page Rule.** Keep source PDF numbers, printed labels, and revision links distinct; citations and search must take the reader to the corresponding allowed source page.

### Tama Assistant Identity
Tama is the user-pinned black-and-white hornbill with an orange beak and casque, green sash edged in purple, and a brown mathematics book. Preserve the transparent cutout and its recognizable proportions. The authored identity raster is `public/mascots/tama-chat.png`; the exact generation prompt, source reference, tool, and reference hash are recorded in `docs/assets/tama-chat.json`. It is distinct from runtime PDF page images, which remain source content. Next Image serves resized optimized derivatives while the source PNG retains alpha.

The lower-right trigger pairs the figure (112×103px desktop; 96×88px mobile) with an explicit “Tanya Tama” label. The trigger hides while chat is open and returns when the panel closes. The label uses the shared control radius, maroon gradient, white text, and SVG message icon. Tama is repeated as a compact panel avatar (56×51px) and as the book reader's scoped assistant icon (35×32px); its colors do not become new interface semantic tokens.

The greeting rocks by −5° then 3°, rising at most 3px, for two 2.2s cycles after a 0.6s delay, then rests. Hover/focus runs one 1.2s greeting. The launcher pauses when the document is hidden or chat is open. The book reader icon uses the same bounded initial greeting. Panel entry lasts 200ms with `cubic-bezier(0.16,1,0.3,1)`, starting 8px below its resting position at 0.98 scale. Reduced motion removes the greeting and spatial entrance. These are CSS transforms and opacity on raster artwork.

Opening focuses the labelled close control; Escape closes and returns focus to the trigger. Outside interaction leaves the nonmodal panel open, and the trigger toggles it. The panel uses the existing conversation and source patterns.

**The Recognizable Tama Rule.** Reuse the authored Tama identity asset for assistant entry points, keep a visible action label, and let greeting motion come to rest; do not substitute generic bird artwork or a perpetual animation.

## Do's and Don'ts

### Do:
- **Do** retain the public identity and scope admin styling to the workspace or drawer.
- **Do** pair category colors with text and SVG icons.
- **Do** use one page h1 and h2 headings for titled data sections.
- **Do** keep overflow inside table containers and retain visible keyboard focus.
- **Do** preserve the reduced-motion treatment and label mobile navigation.
- **Do** keep reader overflow within the page stage or support panel and retain stable header dimensions.
- **Do** show extraction quality and search pagination status alongside readable source excerpts.
- **Do** preserve Tama’s transparent identity artwork, visible action label, and reduced-motion treatment.

### Don't:
- **Don't** import the public hero display size into compact admin panels.
- **Don't** use decorative geometry as the background of dense data text.
- **Don't** turn the dashboard overview composition into a requirement for every route.
- **Don't** treat compact metadata sizes as the default for body copy.

- **Don't** treat runtime document page images as decorative design assets or recolor their content.
