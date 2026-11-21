import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const python = process.env.READER_PYTHON || "python3";
const available =
  spawnSync(python, ["-c", "import pymupdf;import PIL"]).status === 0;
test(
  "NUL characters from a PDF text layer do not reach the database payload",
  { skip: !available },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "reader-nul-"));
    try {
      const output = join(root, "out");
      const result = spawnSync(
        python,
        [
          "-c",
          `import runpy, sys
from pathlib import Path
import pymupdf

pdf = Path(sys.argv[1]) / "source.pdf"
doc = pymupdf.open()
doc.new_page().insert_text((50, 100), "Searchable mathematics research methods and sampling")
doc.save(pdf)
doc.close()

get_text = pymupdf.Page.get_text
def get_text_with_nul(self, *args, **kwargs):
    words = get_text(self, *args, **kwargs)
    first = words[0]
    return [(*first[:4], first[4][:6] + chr(0) + first[4][6:], *first[5:]),
            (*first[:4], chr(0), *first[5:]), *words[1:]]

pymupdf.Page.get_text = get_text_with_nul
sys.argv = ["scripts/reader-extract.py", str(pdf), sys.argv[2], "--kind", "book"]
runpy.run_path(sys.argv[0], run_name="__main__")`,
          root,
          output,
        ],
        { env: { ...process.env, READER_TESSDATA_DIR: root } },
      );
      assert.equal(result.status, 0, result.stderr.toString());
      const parsed = JSON.parse(
        await readFile(join(output, "extracted.json"), "utf8"),
      );
      const [page] = parsed.pages;
      assert.equal(page.text, "Searchable mathematics research methods and sampling");
      assert.deepEqual(
        page.words.map((word) => word.text),
        page.text.split(" "),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
test(
  "restricted thesis pages never enter derived images, text, coordinates or outline",
  { skip: !available },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "reader-policy-"));
    try {
      const pdf = join(root, "source.pdf");
      const output = join(root, "out");
      const make = spawnSync(python, [
        "-c",
        `import pymupdf as f\nd=f.open()\nfor text in ['Judul Dokumen','BAB III\\nMetode penelitian purposive sampling.','BAB IV\\nRAHASIA TIDAK BOLEH DITERBITKAN','BAB V\\nKesimpulan penelitian.']:\n p=d.new_page();p.insert_text((70,70),text)\nd.set_toc([[1,'Metode',2],[1,'Hasil rahasia',3],[1,'Penutup',4]])\nd.save(${JSON.stringify(pdf)})`,
      ]);
      assert.equal(make.status, 0, make.stderr.toString());
      const result = spawnSync(python, [
        "scripts/reader-extract.py",
        pdf,
        output,
        "--kind",
        "thesis",
      ]);
      assert.equal(result.status, 0, result.stderr.toString());
      const parsed = JSON.parse(
        await readFile(join(output, "extracted.json"), "utf8"),
      );
      assert.deepEqual(
        parsed.pages.map((p) => p.number),
        [1, 2, 4],
      );
      assert.ok(!JSON.stringify(parsed).includes("RAHASIA"));
      assert.ok(!parsed.outline.some((o) => o.page === 3));
      assert.ok(!(await readdir(output)).some((f) => f.startsWith("3-")));
      const textOutput = join(root, "text-only");
      const textResult = spawnSync(python, [
        "scripts/reader-extract.py", pdf, textOutput, "--kind", "thesis", "--text-only",
      ]);
      assert.equal(textResult.status, 0, textResult.stderr.toString());
      assert.deepEqual(await readdir(textOutput), ["extracted.json"]);
      const textOnly = JSON.parse(await readFile(join(textOutput, "extracted.json"), "utf8"));
      assert.deepEqual(textOnly.pages.map((page) => page.text), parsed.pages.map((page) => page.text));
      assert.ok(textOnly.pages.every((page) => !page.image && !page.thumbnail && !page.hd && !page.words.length));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
test(
  "uncertain restricted chapter boundaries fail closed before assets are published",
  { skip: !available },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "reader-uncertain-"));
    try {
      const pdf = join(root, "source.pdf");
      const out = join(root, "out");
      spawnSync(python, [
        "-c",
        `import pymupdf as f\nd=f.open();p=d.new_page();p.insert_text((70,70),'Dokumen tanpa batas bab yang jelas.');d.save(${JSON.stringify(pdf)})`,
      ]);
      const result = spawnSync(python, [
        "scripts/reader-extract.py",
        pdf,
        out,
        "--kind",
        "thesis",
      ]);
      assert.notEqual(result.status, 0);
      assert.deepEqual(await readdir(out), []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

test("text-only indexing verifies a removed chapter before indexing the remaining PDF", { skip: !available }, async () => {
  const root = await mkdtemp(join(tmpdir(), "reader-redacted-thesis-"));
  try {
    const make = spawnSync(python, ["-c", `import pymupdf as f, sys
from pathlib import Path
root = Path(sys.argv[1])
for name, prior in [('verified', 6), ('uncertain', 5)]:
    d = f.open()
    toc = d.new_page()
    toc.insert_text((60,100), 'DAFTAR ISI\\nBAB IV HASIL DAN PEMBAHASAN ............ 7\\nBAB V PENUTUP ............ 11')
    for printed, heading in [(1,'BAB I'),(2,'BAB II'),(3,'BAB III'),(4,''),(5,''),(prior,''),(11,'BAB V'),(12,'')]:
        p = d.new_page()
        p.insert_text((300,40), str(printed))
        p.insert_text((60,100), (heading+'\\n' if heading else '')+'Research methods, sampling criteria, and procedures for checking each result.')
    d.save(root / (name+'.pdf'))`, root]);
    assert.equal(make.status, 0, make.stderr.toString());
    for (const [name, numbers, coverage] of [
      ["verified", [1, 2, 3, 4, 5, 6, 7, 8, 9], "chapter-iv-already-removed"],
      ["uncertain", [2, 3], "verified-opening-sections"],
    ]) {
      const output = join(root, name);
      const result = spawnSync(python, ["scripts/reader-extract.py", join(root, `${name}.pdf`), output, "--kind", "thesis", "--text-only"], {
        env: { ...process.env, READER_TESSDATA_DIR: root },
      });
      assert.equal(result.status, 0, result.stderr.toString());
      assert.equal(JSON.parse(result.stdout).coverage, coverage);
      const extracted = JSON.parse(await readFile(join(output, "extracted.json"), "utf8"));
      assert.deepEqual(extracted.pages.map((page) => page.number), numbers);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test(
  "raster-only documents gain searchable OCR text and word coordinates",
  {
    skip:
      !available ||
      spawnSync("tesseract", ["--version"]).status !== 0 ||
      !existsSync(
        resolve(
          process.env.READER_TESSDATA_DIR || ".reader-data/tessdata",
          "eng.traineddata",
        ),
      ),
  },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "reader-ocr-"));
    try {
      const pdf = join(root, "scan.pdf");
      const out = join(root, "out");
      const make = spawnSync(python, [
        "-c",
        `import pymupdf as f\nd=f.open();p=d.new_page();p.insert_text((50,100),'Searchable mathematics research methods sampling',fontsize=20)\npix=p.get_pixmap(matrix=f.Matrix(2,2));o=f.open();q=o.new_page();q.insert_image(q.rect,stream=pix.tobytes('png'));o.save(${JSON.stringify(pdf)})`,
      ]);
      assert.equal(make.status, 0, make.stderr.toString());
      const result = spawnSync(python, [
        "scripts/reader-extract.py",
        pdf,
        out,
        "--kind",
        "book",
      ]);
      assert.equal(result.status, 0, result.stderr.toString());
      const parsed = JSON.parse(
        await readFile(join(out, "extracted.json"), "utf8"),
      );
      assert.equal(parsed.pages[0].quality, "ocr");
      assert.match(parsed.pages[0].text, /mathematics/i);
      assert.ok(parsed.pages[0].words.length > 3);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
