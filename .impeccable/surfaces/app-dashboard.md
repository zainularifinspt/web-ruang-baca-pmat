---
version: 1
slug: "app-dashboard"
primary_target: "app/dashboard"
related_targets: ["components/dashboard-shell.tsx","components/dashboard-overview.tsx","components/admin-page-heading.tsx","components/stat-card.tsx","components/section-card.tsx"]
---

# Dashboard admin

Mode: Operate. Audience: admin, with the shared shell also serving dosen and petugas. Job: manage collections and understand visits. Extends the public identity; public pages were not redesigned.

## Direction contract

THESIS: A focused collection and visits workspace inside Ruang Baca PMat's public identity.

OWN-WORLD: ULM identity, Plus Jakarta Sans, maroon glass, white panels, and mathematical geometry; violet, teal, amber distinguish categories.

STORY: Welcome and date → metrics → operational shortcuts → attendance and composition → recent records.

FIRST VIEWPORT: Floating maroon sidebar, transparent account header, maroon welcome with glass cubes, four metrics, shortcuts, wide attendance chart beside collection composition.

FORM: Responsive glass panels and true CSS 3D cubes. Mobile stacks data panels, preserves compact visible geometry, and uses a labelled drawer. Code-led execution of the user's pinned plan; no invented seed or approved comp.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Shipped behavior

At 1024px the overview metrics expand from two to four columns; the chart/composition row uses a 1.7:1 split and recent records use equal columns. At 1280px the persistent sidebar replaces the drawer. Tables retain local scrolling. Shared cards use h2 section headings; mobile collection titles permit two lines. Compact cube geometry remains visible on mobile.

Routes: /dashboard, /dashboard/katalog, /dashboard/presensi, /dashboard/laporan, /dashboard/pengguna, /dashboard/permissions, /dashboard/profil. Role checks and action visibility remain in force. Historical data is preserved; loans, verification, and WhatsApp workflows are disabled by the user's decision, recorded in PRODUCT.md.

## Finish evidence and limits

Code-led build; no approved visual comp. Finish disposition: ship after four findings were resolved: mobile cube geometry, complete contract blocks, two-line mobile collection titles, and semantic h2 section headings. Review captures: .impeccable/review/desktop.jpg and .impeccable/review/mobile.jpg, using synthetic labelled data. They are verification evidence, not product imagery.

Parent implementation validation: production build passes after removal of the temporary preview route; lint has zero errors and one pre-existing unused-helper warning; three guard tests and ten disabled route/API smoke checks pass. This is not a claim of whole-app authenticated backend validation. No new shipping raster assets were generated.

Durable tokens and components: DESIGN.md and .impeccable/design.json. The more detailed original implementation contract remains .impeccable/admin-direction.md. Unresolved design decisions: none recorded.
