#!/usr/bin/env python3
"""Prepare allowed page images and text before publishing a document revision."""
import argparse
import json
import os
import re
import shutil
from pathlib import Path

import pymupdf as fitz
from PIL import Image


def boundary_damage(text):
    return len(re.findall(r"[A-Za-z]{24,}", text))


def page_content(page, textpage=None):
    words = page.get_text("words", textpage=textpage, sort=True)
    # Join actual word boxes with spaces; some PDF text layers omit separators.
    lines = {}
    for word in words:
        lines.setdefault((word[5], word[6]), []).append(word[4])
    return "\n".join(" ".join(line) for line in lines.values()), words


parser = argparse.ArgumentParser()
parser.add_argument("pdf")
parser.add_argument("output")
parser.add_argument("--kind", choices=["book", "thesis"], required=True)
args = parser.parse_args()
root = Path(args.output)
root.mkdir(parents=True, exist_ok=True)
doc = fitz.open(args.pdf)
if doc.is_encrypted:
    raise RuntimeError("PDF terkunci; tidak dapat diproses.")
if not 1 <= len(doc) <= 1000:
    raise RuntimeError("Batas pemrosesan adalah 1–1000 halaman.")
texts, raw_words, ocr_pages = [], {}, set()
tessdata = Path(os.environ.get("READER_TESSDATA_DIR", ".reader-data/tessdata")).resolve()
ocr_enabled = bool(shutil.which("tesseract")) and (tessdata / "eng.traineddata").exists()
languages = os.environ.get("READER_OCR_LANGUAGES", "eng+ind" if (tessdata / "ind.traineddata").exists() else "eng")
for i, page in enumerate(doc):
    text, words = page_content(page)
    if (len(text.strip()) < 30 or boundary_damage(text) >= 2) and ocr_enabled:
        try:
            tp = page.get_textpage_ocr(language=languages, dpi=150, full=True, tessdata=str(tessdata))
            ocr_text, ocr_words = page_content(page, tp)
            if len(ocr_text.strip()) >= 30 and (len(text.strip()) < 30 or boundary_damage(ocr_text) < boundary_damage(text)):
                text, words = ocr_text, ocr_words
                ocr_pages.add(i)
        except Exception:
            pass  # Preserve the original text/image and report its quality below.
    texts.append(text)
    raw_words[i] = words

hidden = set()
if args.kind == "thesis":
    def chapter(text, roman, number):
        # A contents entry with title/page number does not qualify as a boundary.
        return any(re.fullmatch(r"\s*BAB\s*(" + roman + "|" + number + r")\s*", line) for line in text.upper().splitlines()[:12])

    starts = [i for i, text in enumerate(texts) if chapter(text, "IV", "4")]
    pairs = [(a, b) for a in starts for b, text in enumerate(texts) if b > a and chapter(text, "V", "5")]
    if len(starts) != 1 or len(pairs) != 1:
        raise RuntimeError("Perlu peninjauan: batas Bab IV/V belum dapat dipastikan. Tidak ada halaman dipublikasikan.")
    hidden = set(range(pairs[0][0], pairs[0][1]))

pages = []
for i, page in enumerate(doc):
    if i in hidden:
        continue
    rect = page.rect
    if rect.width <= 0 or rect.height <= 0 or rect.width / rect.height > 5 or rect.height / rect.width > 5:
        raise RuntimeError("Ukuran halaman tidak didukung.")
    assets = {}
    for name, width in [("thumb", 180), ("read", 1100), ("hd", 1800)]:
        pix = page.get_pixmap(matrix=fitz.Matrix(width / rect.width, width / rect.width), alpha=False)
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        filename = f"{i + 1}-{name}.webp"
        image.save(root / filename, "WEBP", quality=88, method=4)
        assets[name] = filename
    words = []
    for word in raw_words[i]:
        box = fitz.Rect(word[:4]) * page.rotation_matrix
        words.append({"text": word[4], "x": max(0, box.x0 / rect.width), "y": max(0, box.y0 / rect.height), "w": max(0, (box.x1 - box.x0) / rect.width), "h": max(0, (box.y1 - box.y0) / rect.height)})
    text = texts[i].strip()
    quality = "image" if len(text) < 30 else "poor" if boundary_damage(text) >= 2 else "ocr" if i in ocr_pages else "text"
    pages.append({"number": i + 1, "label": page.get_label() or str(i + 1), "width": rect.width, "height": rect.height, "text": text, "image": assets["read"], "thumbnail": assets["thumb"], "hd": assets["hd"], "words": words, "quality": quality})
outline = [{"title": title, "page": page} for _, title, page in doc.get_toc() if page > 0 and page - 1 not in hidden][:200]
(root / "extracted.json").write_text(json.dumps({"totalPages": len(doc), "pages": pages, "outline": outline}, ensure_ascii=False))
print(json.dumps({"pages": len(pages), "image_only": sum(p["quality"] == "image" for p in pages), "poor_text": sum(p["quality"] == "poor" for p in pages)}))
