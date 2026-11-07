import assert from "node:assert/strict";
import { test } from "node:test";
const base = process.env.READER_TEST_BASE_URL;
const bookId = process.env.READER_TEST_BOOK_ID;
const thesisId = process.env.READER_TEST_THESIS_ID;
test(
  "live reader APIs share page IDs, deny hidden/stale pages and keep metadata chat working without AI",
  { skip: !base || !bookId || !thesisId },
  async () => {
    assert.ok(
      ["127.0.0.1", "localhost"].includes(new URL(base).hostname),
      "Run against a local test application.",
    );
    const book = `${base}/api/reader/book/${encodeURIComponent(bookId)}`;
    const mr = await fetch(book);
    assert.equal(mr.status, 200);
    const manifest = await mr.json();
    assert.ok(manifest.pages.length > 1);
    assert.ok(
      !("text" in manifest.pages[0]) && !("words" in manifest.pages[0]),
    );
    const search = await fetch(
      `${book}/search?q=analytic&v=${manifest.revision}`,
    ).then((r) => r.json());
    assert.ok(search.hits.length > 0);
    const hit = search.hits.find((h) => h.page === 133) || search.hits[0];
    const page = await fetch(
      `${book}/page?page=${hit.page}&v=${manifest.revision}`,
    ).then((r) => r.json());
    assert.match(page.text, /analytic/i);
    assert.ok(page.words.length);
    const asset = await fetch(base + manifest.pages[0].image);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get("content-type"), "image/webp");
    assert.match(asset.headers.get("cache-control"), /private/);
    assert.equal(
      (await fetch(`${book}/search?q=analytic&v=stale-version`)).status,
      409,
    );
    const thesis = `${base}/api/reader/thesis/${encodeURIComponent(thesisId)}`;
    const tm = await fetch(thesis).then((r) => r.json());
    const visible = new Set(tm.pages.map((p) => p.number));
    const hidden = Array.from({ length: tm.totalPages }, (_, i) => i + 1).find(
      (n) => !visible.has(n),
    );
    assert.ok(hidden, "Expected restricted chapter in the real fixture.");
    assert.equal(
      (await fetch(`${thesis}/page?page=${hidden}&v=${tm.revision}`)).status,
      404,
    );
    assert.equal(
      (await fetch(`${thesis}/assets/${tm.revision}/${hidden}-read.webp`))
        .status,
      404,
    );
    assert.equal((await fetch(`${base}/api/reader/manage`)).status, 403);
    const metadata = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Cari buku tentang analisis" }),
    });
    assert.equal(metadata.status, 200);
    const data = await metadata.json();
    assert.ok(data.sources.length > 0);
    assert.ok(data.paragraphs.length <= 2);
    assert.ok(data.sources.every((s) => s.url.startsWith("/")));
    const outside = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: metadata.headers.get("set-cookie")?.split(";")[0] || "",
      },
      body: JSON.stringify({
        message: "resep rendang makanan untuk makan malam",
      }),
    });
    assert.equal(outside.status, 200);
    const refusal = await outside.json();
    assert.equal(refusal.status, "not_found");
    assert.equal(refusal.sources.length, 0);
  },
);
