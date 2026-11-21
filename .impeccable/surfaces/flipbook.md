# Ruang Baca reader
Mode: Read. User approved the detailed flipbook/search/DeepSeek plan in docs/chatbot-plan.md; execute the pinned plan inside the established public identity. No new visual-world selection; user-pinned direction overrides a roll.

## Direction contract
THESIS: book content leads; search and grounded answers take readers to evidence.
OWN-WORLD: public maroon, Plus Jakarta Sans, glass toolbar and neutral paper stage.
STORY: open book → turn/read → search/ask → cited page.
FIRST VIEWPORT: slim brand/title bar, centered two-page book desktop or one-page mobile, compact bottom page controls, collapsible side search/chat panel. Real processed page imagery is the content.
FORM: user-pinned book spread, responsive single page, bounded bitmap window, keyboard and scroll alternative. No invented seed.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Shipped system record — 7 November 2026

The code-led reader extension is recorded in root `DESIGN.md` and `.impeccable/design.json`, preserving the incumbent public/admin identity and earlier admin documentation. No comp or quality-bar selection was introduced. The bounded finish-review verdict is **ship at the scope of the four reviewed fixes**: word-spaced search excerpts with overflow handling and extraction warnings; stable mobile header and message-container autoscroll; supporting-copy contrast (reviewed at 5.66–6.68:1); and search counts that distinguish known loaded results from more available results. All four were reported resolved. This is not a fresh whole-surface approval.

Reviewed captures: `.impeccable/review/reader-desktop.png`, `reader-search.png`, `reader-mobile.png`, and `reader-chat-mobile.png` (opened and validated in the parent implementation review). Implementation evidence: `components/reader/reader.css`, `reader-app.tsx`, `flip-stage.tsx`, `chat-panel.tsx`, `chat-launcher.tsx`, `components/ebook-pdf-viewer.tsx`, and `app/baca/[type]/[id]/page.tsx`.

Page imagery is runtime-generated WebP from actual public PDFs, not generated decorative art. Source URL/hash/policy are stored with local manifest/version metadata. Public document content is not design-system artwork. The original reader pass committed no generated decorative rasters. The later Tama launcher extension adds authored mascot artwork to the book chat control; its source and prompt are recorded in `docs/assets/tama-chat.json`. The tilted invitation book is CSS geometry with an SVG icon.

Live AI remains inactive by the user's integration/configuration-first choice. SQL was not applied to remote production. `docs/reader-setup.md` records the local sample processing, simulated AI adapter validation, and production setup/performance limits. This system record does not certify live AI quality or production readiness.

Not canonized: compact 9–11px auxiliary metadata is carried by the build but is not a body-copy standard; document scans and extraction defects are source-content limitations, not typography rules or identity assets.
