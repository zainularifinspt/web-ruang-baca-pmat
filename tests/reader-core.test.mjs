import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readerKey,
  readerUrl,
  searchPages,
  chunkPages,
  retrieveChunks,
  validateAnswer,
} from "../lib/reader/core.ts";
import { allowedPdfUrl } from "../lib/reader/network.ts";
const page = (number, text) => ({
  number,
  label: String(number - 10),
  width: 600,
  height: 800,
  text,
  words: [{ text: "purposive", x: 0.2, y: 0.3, w: 0.1, h: 0.02 }],
  image: `${number}-read.webp`,
  thumbnail: `${number}-thumb.webp`,
  hd: `${number}-hd.webp`,
  quality: "text",
});
const doc = {
  pages: [
    page(
      42,
      "Metode penelitian menggunakan purposive sampling untuk memilih partisipan.",
    ),
    page(
      55,
      "Kesimpulan penelitian dan saran untuk pengembangan pembelajaran.",
    ),
  ],
  chunks: [
    {
      id: "p42",
      page: 42,
      text: "Metode penelitian menggunakan purposive sampling untuk memilih partisipan.",
    },
  ],
};
const sources = [
  {
    id: "s1",
    title: "Dokumen",
    page: 42,
    label: "32",
    url: "/baca/skripsi/x?page=42",
    excerpt: doc.pages[0].text,
  },
];
test("canonical source pages retain PDF numbers rather than display offsets", () => {
  assert.equal(readerKey("book", "ebk-a"), "book-ebk-a");
  assert.throws(() => readerKey("book", "../../secret"));
  assert.equal(
    readerUrl("thesis", "x", 42, "abc"),
    "/baca/skripsi/x?page=42&v=abc",
  );
  const found = searchPages(doc, "purposive sampling");
  assert.equal(found.length, 1);
  assert.equal(found[0].page, 42);
  assert.equal(found[0].label, "32");
  assert.equal(found[0].matches.length, 1);
});
test("absent topics produce no keyword or retrieval evidence", () => {
  assert.equal(searchPages(doc, "memasak rendang").length, 0);
  assert.equal(retrieveChunks(doc, "memasak rendang").length, 0);
  assert.equal(
    retrieveChunks(doc, "purposive sampling", undefined, 55).length,
    0,
  );
});
test("chunks never invent another page, even with overlapping content", () => {
  const chunks = chunkPages([
    page(42, "kata ".repeat(650)),
    page(55, "pembahasan ".repeat(100)),
  ]);
  assert.equal(chunks.length, 4);
  assert.ok(chunks.every((c) => [42, 55].includes(c.page)));
  assert.ok(chunks[0].text.split(" ").length <= 300);
});
test("answers require exact evidence, allowed references, and at most two paragraphs", () => {
  const valid = {
    paragraphs: ["Penelitian menggunakan purposive sampling."],
    citations: [
      { id: "s1", quote: "Metode penelitian menggunakan purposive sampling" },
    ],
  };
  assert.ok(validateAnswer(valid, sources));
  assert.equal(
    validateAnswer(
      { ...valid, paragraphs: ["Paragraf satu\rParagraf dua\rParagraf tiga"] },
      sources,
    ),
    null,
  );
  assert.equal(
    validateAnswer(
      {
        paragraphs: ["Relasi mengikuti sumber."],
        citations: [
          { id: "math", quote: "Nilai dalam relasi matematika adalah a > b." },
        ],
      },
      [
        {
          id: "math",
          title: "Math",
          url: "/baca/buku/math?page=1",
          page: 1,
          excerpt: "Nilai dalam relasi matematika adalah a < b.",
        },
      ],
    ),
    null,
  );
  assert.equal(
    validateAnswer({ ...valid, paragraphs: ["a", "b", "c"] }, sources),
    null,
  );
  assert.equal(
    validateAnswer(
      {
        ...valid,
        citations: [{ id: "outside", quote: valid.citations[0].quote }],
      },
      sources,
    ),
    null,
  );
  assert.equal(
    validateAnswer(
      {
        ...valid,
        citations: [
          {
            id: "s1",
            quote: "Ini kutipan yang sepenuhnya tidak ada pada sumber",
          },
        ],
      },
      sources,
    ),
    null,
  );
  assert.equal(
    validateAnswer({ ...valid, paragraphs: ["Lihat halaman 999."] }, sources),
    null,
  );
  assert.equal(
    validateAnswer(
      { ...valid, paragraphs: ["<script>alert(1)</script>"] },
      sources,
    ),
    null,
  );
  assert.equal(
    validateAnswer({ ...valid, paragraphs: ["kata ".repeat(170)] }, sources),
    null,
  );
  assert.equal(
    validateAnswer({ ...valid, paragraphs: ["A\nB"] }, sources),
    null,
  );
});
test("PDF ingestion denies arbitrary hosts, credentials, ports, and local targets", () => {
  for (const url of [
    "http://drive.google.com/a",
    "https://localhost/a",
    "https://127.0.0.1/a",
    "https://drive.google.com.evil.invalid/a",
    "https://a:b@drive.google.com/a",
    "https://drive.google.com:444/a",
    "file:///tmp/a",
  ])
    assert.throws(() => allowedPdfUrl(url));
  assert.equal(
    allowedPdfUrl("https://drive.google.com/file/d/example/view").hostname,
    "drive.google.com",
  );
});
