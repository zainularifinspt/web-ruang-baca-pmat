import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL?.endsWith("/reader/journals.ts") && ["./core", "../journals-data"].includes(specifier)) {
      return next(specifier + ".ts", context);
    }
    return next(specifier, context);
  },
});

const { journalCatalogAnswer } = await import("../lib/reader/journals.ts");

test("Tama lists both journals from the same catalog used on the home page", () => {
  const answer = journalCatalogAnswer("Jurnal apa yang ada di jurusan pendidikan matematika?");
  assert.equal(answer.status, "answered");
  assert.deepEqual(answer.sources.map((source) => source.id), ["journal-edumat", "journal-jurmadikta"]);
  assert.match(answer.paragraphs.join(" "), /EDU-MAT.*JURMADIKTA/);
  assert.ok(answer.sources.every((source) => new URL(source.url).hostname.endsWith(".ulm.ac.id")));
  assert.equal(journalCatalogAnswer("Cari skripsi tentang analisis artikel jurnal pendidikan matematika"), null);
});
