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
