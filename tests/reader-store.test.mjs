import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

const databaseUrl =
  "data:text/javascript," +
  encodeURIComponent(`
    let fixture;
    export function setFixture(value) { fixture = value; }
    export function createSupabaseAdminClient() {
      return {
        from(table) {
          const query = {
            select() { return this; },
            eq() { return this; },
            order() { return this; },
          };
          if (table === "reader_documents") {
            return { ...query, async maybeSingle() {
              return { data: { active_revision: "r", is_public: true } };
            } };
          }
          if (table === "reader_document_versions") {
            return { ...query, async single() {
              return { data: {
                id: "r", source_url: "fixture",
                policy: "public-v1-no-chapter-iv",
                total_pages: fixture.totalPages,
              } };
            } };
          }
          return { ...query, async range(from, to) {
            fixture.ranges.push([from, to]);
            if (from === fixture.failOffset) {
              return { data: null, error: { message: "Fixture failure" } };
            }
            return { data: fixture.pages.slice(from, to + 1) };
          } };
        },
      };
    }
  `);

registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL?.endsWith("/lib/reader/store.ts")) {
      if (specifier === "@/lib/supabase-admin") {
        return { url: databaseUrl, shortCircuit: true };
      }
      if (specifier === "./catalog" || specifier === "./pilot") {
        const code =
          specifier === "./catalog"
            ? 'export const publicCollection = async () => ({ pdfUrl: "fixture" }); export const sourceUrl = item => item.pdfUrl;'
            : "export const readPilotBook = () => null; export const readPilotPages = () => [];";
        return {
          url: "data:text/javascript," + encodeURIComponent(code),
          shortCircuit: true,
        };
      }
    }
    if (
      context.parentURL?.includes("/lib/reader/") &&
      specifier.startsWith("./") &&
      !specifier.endsWith(".ts")
    ) {
      return next(specifier + ".ts", context);
    }
    return next(specifier, context);
  },
});

const { setFixture } = await import(databaseUrl);
const { getReaderDocument } = await import("../lib/reader/store.ts");

test("published books load every page beyond Supabase's first 1,000 rows", async () => {
  const previousStorage = process.env.READER_STORAGE;
  process.env.READER_STORAGE = "supabase";
  const pages = Array.from({ length: 1226 }, (_, i) => ({
    page_number: i + 1,
  }));
  try {
    const fixture = { totalPages: 1226, pages, ranges: [] };
    setFixture(fixture);
    const document = await getReaderDocument("book", "fixture");
    assert.equal(document.pages.length, 1226);
    assert.equal(document.pages[999].number, 1000);
    assert.equal(document.pages[1000].number, 1001);
    assert.equal(document.pages.at(-1).number, 1226);
    assert.deepEqual(fixture.ranges, [[0, 999], [1000, 1999]]);

    setFixture({ totalPages: 1226, pages: pages.slice(0, 1000), ranges: [] });
    assert.equal(await getReaderDocument("book", "fixture"), null);

    setFixture({ totalPages: 1226, pages, failOffset: 1000, ranges: [] });
    assert.equal(await getReaderDocument("book", "fixture"), null);

    setFixture({
      totalPages: 5,
      pages: [1, 2, 4, 5].map((page_number) => ({ page_number })),
      ranges: [],
    });
    assert.deepEqual(
      (await getReaderDocument("thesis", "fixture")).pages.map((page) => page.number),
      [1, 2, 4, 5],
    );
  } finally {
    if (previousStorage === undefined) delete process.env.READER_STORAGE;
    else process.env.READER_STORAGE = previousStorage;
  }
});
