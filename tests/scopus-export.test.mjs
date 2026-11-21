import assert from "node:assert/strict";
import { test } from "node:test";
import * as XLSX from "xlsx";
import { parseScopusEntry, searchScopusArticles, formatScopusQuery } from "../lib/scopus.ts";
import {
  assertScopusExportable, collectAllScopusArticles, createScopusExport,
  deduplicateScopusArticles, generateScopusCsv, generateScopusRis, scopusSearchIdentity,
} from "../lib/scopus-export.ts";

const search = {
  query: "mathematics education", executedQuery: "TITLE(mathematics AND education)",
  searchedAt: "2026-11-01T02:00:00.000Z", sort: "relevance", searchField: "title",
  year: "all", language: "all", docType: "all", openAccessOnly: false,
};
const article = (id) => ({
  id: String(id), eid: `2-s2.0-${id}`, title: 'Pembelajaran "Matematika", α',
  authors: "Arifin, Z., & Doe, J.", authorNames: ["Arifin, Zainul", "Doe, Jane"], authorSource: "crossref",
  journal: "Journal of Mathematics", year: "2024", coverDate: "2024-05-01",
  doi: `10.1234/example.${id}`, doiUrl: `https://doi.org/10.1234/example.${id}`,
  volume: "3", issue: "2", pages: "101–120", issn: "1234-5678", eIssn: "2345-6789",
  citedByCount: 5, affiliations: ["Universitas Lambung Mangkurat"],
  aggregationType: "Journal", subtypeDescription: "Article", keywords: ["mathematics", "SLR"],
});
const response = (page = 1, overrides = {}) => ({
  articles: Array.from({ length: page === 3 ? 2 : 5 }, (_, i) => article((page - 1) * 5 + i + 1)),
  page, pageSize: 5, totalResults: 12, totalPages: 3, isDemo: false, search, ...overrides,
});
const metadata = { search, scope: "selected", totalResults: 12, retrievedCount: 2, exportedAt: "2026-11-01T02:10:00.000Z" };

test("all-result export collects every page, including when starting from page 2", async () => {
  const fetched = [];
  const progress = [];
  const results = await collectAllScopusArticles(response(2), async (page) => { fetched.push(page); return response(page); }, new AbortController().signal, (n) => progress.push(n));
  assert.deepEqual(fetched, [1, 3]);
  assert.equal(results.length, 12);
  assert.deepEqual(progress, [0, 5, 10, 12]);
});

test("demo pages, missing provenance, partial results, changed results and repeated pages fail closed", async () => {
  assert.throws(() => assertScopusExportable(response(1, { isDemo: true })), /simulasi/);
  assert.throws(() => assertScopusExportable(response(1, { search: undefined })), /Catatan/);
  for (const nextPage of [
    response(2, { isDemo: true }),
    response(2, { articles: [] }),
    response(2, { totalResults: 13 }),
    response(2, { search: { ...search, executedQuery: "TITLE(other)" } }),
    response(2, { articles: response(1).articles }),
  ]) {
    await assert.rejects(collectAllScopusArticles(response(), async () => nextPage, new AbortController().signal, () => {}));
  }
});

test("over-limit requests and cancellation stop before more data is fetched", async () => {
  let calls = 0;
  const fetchPage = async (page) => { calls++; return response(page); };
  await assert.rejects(collectAllScopusArticles(response(1, { totalResults: 5001 }), fetchPage, new AbortController().signal, () => {}), /5.000/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(collectAllScopusArticles(response(), fetchPage, controller.signal, () => {}), { name: "AbortError" });
  assert.equal(calls, 0);
});

test("deduplication normalizes DOI and retains distinct records", () => {
  assert.equal(deduplicateScopusArticles([article(1), article(1), { ...article(2), doi: "HTTPS://DOI.ORG/10.1234/EXAMPLE.1" }, article(3)]).length, 2);
});

test("isolated duplicate records are collected and removed with an explicit count in the export log", async () => {
  const results = await collectAllScopusArticles(response(), async (page) => {
    const result = response(page);
    if (page === 2) result.articles[0] = article(5);
    return result;
  }, new AbortController().signal, () => {});
  assert.equal(results.length, 12);
  assert.equal(deduplicateScopusArticles(results).length, 11);
});

test("CSV round-trips Unicode, quotes, multiline abstracts, screening and search provenance; neutralizes formulas", () => {
  const a = { ...article(1), title: '=HYPERLINK("https://example.com")', abstract: "Baris satu\nBaris dua" };
  const csv = generateScopusCsv([a, article(2)], metadata);
  assert.ok(csv.startsWith("\uFEFF"));
  const workbook = XLSX.read(csv, { type: "string", raw: true });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].Judul, `'${a.title}`);
  assert.equal(rows[0].Abstrak, a.abstract);
  assert.equal(rows[1].Judul, article(2).title);
  assert.equal(rows[0]["Query Scopus yang dijalankan"], search.executedQuery);
  assert.equal(rows[0]["Keputusan screening"], "");
});

test("Excel opens as a real workbook with two sheets, provenance and blank screening columns", async () => {
  const file = await createScopusExport([article(1), { ...article(2), title: "=1+1" }], metadata, "xlsx");
  const workbook = XLSX.read(file.content, { type: "array" });
  assert.deepEqual(workbook.SheetNames, ["Artikel & Screening", "Catatan Pencarian"]);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].Penulis, "Arifin, Zainul; Doe, Jane");
  assert.equal(rows[1].Judul, "=1+1");
  assert.equal(workbook.Sheets[workbook.SheetNames[0]].B3.f, undefined);
  for (const column of ["Keputusan screening", "Alasan eksklusi", "Reviewer", "Catatan"]) assert.equal(rows[0][column], "");
  const log = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);
  assert.ok(log.some((row) => row.Informasi === "Artikel diekspor" && row.Nilai === 2));
});

test("RIS has one author tag per person, valid boundaries, pages, identifiers, keywords and safe multiline values", () => {
  const ris = generateScopusRis([{ ...article(1), abstract: "baris satu\nER  - injected" }, { ...article(2), subtypeDescription: "Conference Paper" }], metadata);
  const records = ris.trimEnd().split(/ER  -\s*\r\n\r\n/);
  assert.equal(records.length, 2);
  assert.equal((ris.match(/^AU  - /gm) || []).length, 4);
  assert.equal((ris.match(/^TY  - /gm) || []).length, 2);
  assert.equal((ris.match(/^ER  - /gm) || []).length, 2);
  assert.match(ris, /TY  - CONF/);
  assert.match(ris, /SP  - 101\r\nEP  - 120/);
  assert.match(ris, /SN  - 1234-5678/);
  assert.match(ris, /KW  - SLR/);
  assert.match(ris, /AB  - baris satu ER  - injected/);
});

test("Scopus parsing retains identifiers and structured authors without inventing publication years", () => {
  const parsed = parseScopusEntry({ eid: "2-s2.0-1", "dc:title": "A title", "dc:creator": "Doe, J.", "prism:issn": "1234-5678", "prism:eIssn": "2345-6789", "source-id": "123" });
  assert.deepEqual(parsed.authorNames, ["Doe, J."]);
  assert.equal(parsed.authorSource, "creator");
  assert.equal(parsed.year, "");
  assert.equal(parsed.openAccess, undefined);
  assert.equal(parsed.issn, "1234-5678");
  assert.equal(parsed.sourceId, "123");
});

test("selection identity changes with query/filter but preserves choices across sorting/pages", () => {
  assert.equal(scopusSearchIdentity(search), scopusSearchIdentity({ ...search, sort: "newest", page: 2 }));
  assert.notEqual(scopusSearchIdentity(search), scopusSearchIdentity({ ...search, year: "2024" }));
  const current = new Date().getFullYear();
  assert.match(formatScopusQuery({ rawQuery: "math", year: "last3" }), new RegExp(`PUBYEAR > ${current - 3}`));
});

test("strict export requests never fall back to demo on API failure", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  try {
    globalThis.fetch = async () => new Response("API unavailable", { status: 429 });
    console.warn = () => {};
    await assert.rejects(searchScopusArticles({ query: "math", apiKey: "test-fixture-key", allowDemo: false }), /429/);
    globalThis.fetch = async () => new Response(JSON.stringify({ "search-results": {} }), { status: 200 });
    const result = await searchScopusArticles({ query: "math", apiKey: "test-fixture-key", allowDemo: false });
    assert.equal(result.isDemo, false);
    assert.equal(result.totalResults, 0);
    assert.equal(result.search.executedQuery, "TITLE(math)");
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("custom CSV and Excel contain exactly the selected columns and can omit search logs", async () => {
  const custom = { ...metadata, settings: { fields: ["title", "year", "doi"], includeSearchLog: false } };
  const csv = XLSX.read(Buffer.from(generateScopusCsv([article(1)], custom)), { type: "buffer", raw: true });
  const csvRows = XLSX.utils.sheet_to_json(csv.Sheets[csv.SheetNames[0]]);
  assert.deepEqual(Object.keys(csvRows[0]), ["Judul", "Tahun", "DOI"]);
  const file = await createScopusExport([article(1)], custom, "xlsx");
  const workbook = XLSX.read(file.content, { type: "array" });
  assert.equal(workbook.SheetNames.length, 1);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  assert.deepEqual(Object.keys(rows[0]), ["Judul", "Tahun", "DOI"]);
  assert.throws(() => generateScopusCsv([article(1)], { ...custom, settings: { fields: [] } }), /minimal satu/);
});

test("custom RIS omits unselected metadata and logs, retaining required record markers", () => {
  const ris = generateScopusRis([article(1)], { ...metadata, settings: { fields: ["title", "doi", "screeningDecision"], includeSearchLog: false } });
  assert.match(ris, /TY  - JOUR/);
  assert.match(ris, /TI  - /);
  assert.match(ris, /DO  - /);
  for (const tag of ["AU", "PY", "ID", "SN", "N1", "DB", "T2", "VL", "IS", "KW"]) assert.doesNotMatch(ris, new RegExp(`^${tag}  - `, "m"));
  assert.throws(() => generateScopusRis([article(1)], { ...metadata, settings: { fields: ["screeningDecision"] } }), /kolom referensi/);
});

test("advanced queries preserve Boolean logic, quotes, DOI and filters exactly", () => {
  const query = 'TITLE-ABS-KEY ( "mathematical literacy" OR numeracy ) AND PUBYEAR > 2020 AND DOI("10.1234/example.1")';
  assert.equal(formatScopusQuery({ rawQuery: query, queryMode: "advanced", year: "2024", language: "english", openAccessOnly: true }), query);
  assert.throws(() => formatScopusQuery({ rawQuery: 'TITLE-ABS-KEY("math"', queryMode: "advanced" }), /berpasangan/);
  assert.throws(() => formatScopusQuery({ rawQuery: "", queryMode: "advanced" }), /terlebih dahulu/);
  assert.notEqual(scopusSearchIdentity({ ...search, queryMode: "advanced" }), scopusSearchIdentity(search));
  assert.equal(scopusSearchIdentity({ ...search, queryMode: "advanced" }), scopusSearchIdentity({ ...search, queryMode: "advanced", year: "2024" }));
});

test("advanced requests pass through unchanged and never substitute demo results for a syntax error", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const query = 'TITLE-ABS-KEY("mathematical literacy" OR numeracy) AND PUBYEAR > 2020';
  try {
    globalThis.fetch = async (url) => {
      assert.equal(new URL(url).searchParams.get("query"), query);
      return new Response(JSON.stringify({ "search-results": { "opensearch:totalResults": "0", entry: [] } }));
    };
    const result = await searchScopusArticles({ query, queryMode: "advanced", year: "2024", apiKey: "test-fixture-key" });
    assert.equal(result.search.queryMode, "advanced");
    assert.equal(result.search.year, "all");
    assert.equal(result.search.executedQuery, query);
    console.warn = () => {};
    globalThis.fetch = async () => new Response("invalid query", { status: 400 });
    await assert.rejects(searchScopusArticles({ query, queryMode: "advanced", apiKey: "test-fixture-key" }), { name: "ScopusQueryError" });
  } finally { globalThis.fetch = originalFetch; console.warn = originalWarn; }
});
