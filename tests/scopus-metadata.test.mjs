import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchScopusMetadata, parseScopusMetadata } from "../lib/scopus-metadata.ts";
import { getScopusExportFields, scopusArticleNeedsMetadata, SCOPUS_CITATION_FIELDS, SCOPUS_SLR_FIELDS } from "../lib/scopus-export.ts";

const payload = { "abstracts-retrieval-response": {
  coredata: { "dc:identifier": "SCOPUS_ID:123", "dc:description": "Abstract from Scopus.", "dc:publisher": "Example Publisher" },
  language: { "@xml:lang": "eng" },
  authkeywords: { "author-keyword": [{ "$": "mathematical literacy" }, { "$": "SLR" }] },
  idxterms: { mainterm: { "$": "education" } },
  authors: { author: [{ "ce:surname": "Arifin", "ce:initials": "Z.", "preferred-name": { "ce:surname": "Arifin", "ce:given-name": "Zainul" } }] },
  item: { bibrecord: { head: { source: { "sourcetitle-abbrev": "J. Math." } } } },
} };

test("Abstract Retrieval maps authors, abstract, keywords, language, publisher and source abbreviation", () => {
  const article = parseScopusMetadata(payload);
  assert.deepEqual(article.authorNames, ["Arifin, Zainul"]);
  assert.equal(article.authorSource, "scopus");
  assert.equal(article.abstract, "Abstract from Scopus.");
  assert.deepEqual(article.keywords, ["mathematical literacy", "SLR"]);
  assert.deepEqual(article.indexedKeywords, ["education"]);
  assert.equal(article.language, "eng");
  assert.equal(article.publisher, "Example Publisher");
  assert.equal(article.sourceAbbreviation, "J. Math.");
  assert.deepEqual(parseScopusMetadata({}), {});
});

test("nested abstract paragraphs are preserved without attribute values or object placeholders", () => {
  const article = parseScopusMetadata({ "abstracts-retrieval-response": { coredata: { "dc:description": { "@xml:lang": "eng", "ce:para": [{ "$": "Paragraph one." }, { "$": "Paragraph two." }] } } } });
  assert.equal(article.abstract, "Paragraph one.\nParagraph two.");
});

test("field presets request extra metadata only when needed; RIS excludes screening fields", () => {
  assert.ok(SCOPUS_CITATION_FIELDS.includes("authors"));
  assert.ok(SCOPUS_SLR_FIELDS.includes("abstract"));
  assert.equal(scopusArticleNeedsMetadata({ authorNames: ["Doe, Jane"], authorSource: "crossref" }, ["authors", "title"]), false);
  assert.equal(scopusArticleNeedsMetadata({ authorNames: ["Doe J."], authorSource: "creator" }, ["authors"]), true);
  assert.equal(scopusArticleNeedsMetadata({ keywords: [] }, ["keywords"]), true);
  assert.equal(scopusArticleNeedsMetadata({ keywords: ["math"] }, ["keywords"]), false);
  assert.equal(getScopusExportFields({ fields: ["title", "screeningDecision"] }, "ris").length, 1);
});

test("metadata access denial is explicit, success validates EID, cancellation propagates", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.SCOPUS_API_KEY;
  process.env.SCOPUS_API_KEY = "test-fixture-key";
  try {
    globalThis.fetch = async () => new Response("denied", { status: 403 });
    const denied = await fetchScopusMetadata("2-s2.0-123", new AbortController().signal);
    assert.equal(denied.unavailable, true);
    assert.match(denied.warning, /tidak tersedia/);
    globalThis.fetch = async () => new Response(JSON.stringify(payload));
    const result = await fetchScopusMetadata("2-s2.0-123", new AbortController().signal);
    assert.equal(result.article.abstract, "Abstract from Scopus.");
    await assert.rejects(fetchScopusMetadata("2-s2.0-999", new AbortController().signal), /tidak cocok/);
    globalThis.fetch = async (_, options) => { options.signal.throwIfAborted(); return new Response(JSON.stringify(payload)); };
    const controller = new AbortController(); controller.abort();
    await assert.rejects(fetchScopusMetadata("2-s2.0-123", controller.signal), { name: "AbortError" });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SCOPUS_API_KEY; else process.env.SCOPUS_API_KEY = originalKey;
  }
});

test("metadata falls back to an allowed view and remembers its permission level", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.SCOPUS_API_KEY;
  process.env.SCOPUS_API_KEY = "test-fixture-limited-key";
  const views = [];
  try {
    globalThis.fetch = async (url) => {
      const view = new URL(url).searchParams.get("view"); views.push(view);
      return view === "META" ? new Response(JSON.stringify({ "abstracts-retrieval-response": { coredata: { "dc:identifier": "SCOPUS_ID:123", "dc:publisher": "Allowed Publisher" } } })) : new Response("not entitled", { status: 403 });
    };
    const first = await fetchScopusMetadata("2-s2.0-123", new AbortController().signal);
    assert.deepEqual(views, ["FULL", "META_ABS", "META"]);
    assert.equal(first.article.publisher, "Allowed Publisher");
    assert.equal(first.article.abstract, undefined);
    assert.match(first.warning, /sebagian metadata/);
    assert.equal(first.unavailable, undefined);
    views.length = 0;
    await fetchScopusMetadata("2-s2.0-123", new AbortController().signal);
    assert.deepEqual(views, ["META"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SCOPUS_API_KEY; else process.env.SCOPUS_API_KEY = originalKey;
  }
});
