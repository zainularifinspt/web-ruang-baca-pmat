import { PRODI_JOURNALS } from "../journals-data";
import { normalizeText } from "./core";
import type { ChatResult } from "./types";

export function journalCatalogAnswer(question: string): ChatResult | null {
  const query = normalizeText(question);
  const compact = query.replace(/\s/g, "");
  const named = PRODI_JOURNALS.filter((journal) => compact.includes(journal.id));
  const list = /\bjurnal\b/.test(query) &&
    /\b(?:jurusan|prodi|program studi|pendidikan matematika|fkip|ulm|ruang baca|kampus)\b/.test(query) &&
    /\b(?:apa|daftar|ada|punya|berapa|sebutkan|dikelola|diterbitkan|milik)\b/.test(query);
  if (!named.length && !list) return null;
  if (/\b(?:buku|skripsi|artikel|paper|volume|unduh|scopus)\b/.test(query) && !/\b(?:terbit|jadwal|ruang lingkup|akreditasi)\b/.test(query))
    return null;
  const journals = named.length ? named : PRODI_JOURNALS;
  const sources = journals.map((journal) => ({
    id: `journal-${journal.id}`,
    title: journal.title,
    author: `${journal.accreditationBadge} · ${journal.frequency}`,
    url: journal.url,
    excerpt: journal.description,
  }));
  let paragraphs = journals.map((journal) =>
    `${journal.title} (${journal.accreditationBadge}) terbit ${journal.frequency.toLowerCase()}.`,
  );
  if (!named.length) {
    paragraphs = [`Program Studi Pendidikan Matematika FKIP ULM memiliki ${journals.length} jurnal: ${journals.map((journal) => journal.title).join(" dan ")}. Keduanya berperingkat ${journals[0].accreditationBadge}.`];
  } else if (/\b(?:editor|redaksi|pengelola)\b/.test(query)) {
    paragraphs = journals.map((journal) => `Pemimpin redaksi ${journal.shortName} adalah ${journal.editorInChief}.`);
  } else if (/\b(?:p issn|e issn|issn)\b/.test(query)) {
    paragraphs = journals.map((journal) => `${journal.shortName} memiliki ISSN cetak ${journal.pIssn} dan ISSN elektronik ${journal.eIssn}.`);
  } else if (/\b(?:fokus|cakupan|ruang lingkup|scope)\b/.test(query)) {
    paragraphs = journals.map((journal) => `${journal.shortName} mencakup ${journal.scope.join(", ")}.`);
  }
  return { status: "answered", paragraphs, sources };
}
