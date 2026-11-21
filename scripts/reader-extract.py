#!/usr/bin/env python3
"""Prepare allowed page images and text before publishing a document revision."""
import argparse
import json
import os
import re
import shutil
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import pymupdf as fitz
from PIL import Image


def boundary_damage(text):
    return len(re.findall(r"[A-Za-z]{24,}", text))


def page_content(page, textpage=None):
    words = []
    for word in page.get_text("words", textpage=textpage, sort=True):
        # PostgreSQL rejects NUL in both text and JSON strings.
        text = word[4].replace("\0", "")
        if text:
            words.append((*word[:4], text, *word[5:]))
    # Join actual word boxes with spaces; some PDF text layers omit separators.
    lines = {}
    for word in words:
        lines.setdefault((word[5], word[6]), []).append(word[4])
    return "\n".join(" ".join(line) for line in lines.values()), words


def ocr_pages(doc, candidates, languages, tessdata):
    results = []
    for index, original_length, original_damage in candidates:
        try:
            page = doc[index]
            text_page = page.get_textpage_ocr(language=languages, dpi=150, full=True, tessdata=tessdata)
            text, words = page_content(page, text_page)
            if len(text.strip()) >= 30 and (original_length < 30 or boundary_damage(text) < original_damage):
                results.append((index, text, words))
        except Exception:
            pass  # A page with failed OCR keeps the original extraction.
    return results


def ocr_batch(task):
    filename, candidates, languages, tessdata = task
    with fitz.open(filename) as doc:
        return ocr_pages(doc, candidates, languages, tessdata)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf")
    parser.add_argument("output")
    parser.add_argument("--kind", choices=["book", "thesis"], required=True)
    parser.add_argument("--text-only", action="store_true")
    args = parser.parse_args()
    webp_quality = int(os.environ.get("READER_WEBP_QUALITY", "88"))
    if not 60 <= webp_quality <= 95:
        raise RuntimeError("Kualitas WebP harus antara 60 dan 95.")
    root = Path(args.output)
    root.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(args.pdf)
    if doc.is_encrypted:
        raise RuntimeError("PDF terkunci; tidak dapat diproses.")
    page_limit = 1500 if args.kind == "book" else 1000
    if not 1 <= len(doc) <= page_limit:
        raise RuntimeError(f"Batas pemrosesan adalah 1–{page_limit} halaman.")
    texts, raw_words, ocr_done = [], {}, set()
    candidates = []
    tessdata = Path(os.environ.get("READER_TESSDATA_DIR", ".reader-data/tessdata")).resolve()
    ocr_enabled = bool(shutil.which("tesseract")) and (tessdata / "eng.traineddata").exists()
    languages = os.environ.get("READER_OCR_LANGUAGES", "eng+ind" if (tessdata / "ind.traineddata").exists() else "eng")
    for i, page in enumerate(doc):
        text, words = page_content(page)
        texts.append(text)
        raw_words[i] = words
        if ocr_enabled:
            length, damage = len(text.strip()), boundary_damage(text)
            if length < 30 or damage >= 2:
                candidates.append((i, length, damage))

    worker_limit = int(os.environ.get("READER_OCR_WORKERS", "3")) if args.text_only else 1
    workers = max(1, min(worker_limit, os.cpu_count() or 1, 3, len(candidates) // 6))
    if workers > 1:
        tasks = [(args.pdf, candidates[i::workers], languages, str(tessdata)) for i in range(workers)]
        try:
            with ProcessPoolExecutor(max_workers=workers) as pool:
                ocr_results = [page for batch in pool.map(ocr_batch, tasks) for page in batch]
        except (OSError, RuntimeError):
            ocr_results = ocr_pages(doc, candidates, languages, str(tessdata))
    else:
        ocr_results = ocr_pages(doc, candidates, languages, str(tessdata))
    for index, text, words in ocr_results:
        texts[index], raw_words[index] = text, words
        ocr_done.add(index)

    hidden = set()
    coverage = "allowed-pages"
    if args.kind == "thesis":
        def chapter(text, roman, number):
            # A contents entry with title/page number does not qualify as a boundary.
            return any(re.fullmatch(r"\s*BAB\s*(" + roman + "|" + number + r")\s*", line) for line in text.upper().splitlines()[:12])

        starts = [i for i, text in enumerate(texts) if chapter(text, "IV", "4")]
        pairs = [(a, b) for a in starts for b, text in enumerate(texts) if b > a and chapter(text, "V", "5")]
        if len(starts) == 1 and len(pairs) == 1:
            hidden = set(range(*pairs[0]))
        elif args.text_only and starts and starts[0] > 0:
            # With no reliable end, keep only the prefix before the first IV heading.
            hidden = set(range(starts[0], len(doc)))
            coverage = "before-chapter-iv"
        elif args.text_only:
            # An unclear chapter boundary must never turn into access to the whole PDF.
            # Keep standalone abstracts and the first two chapters only when I–III can
            # be located in order using their standalone headings.
            opening = [[i for i, text in enumerate(texts) if chapter(text, roman, number)]
                       for roman, number in [("I", "1"), ("II", "2"), ("III", "3")]]
            confirmed = set()
            if all(len(indices) == 1 for indices in opening):
                first, second, third = (indices[0] for indices in opening)
                if first < second < third:
                    confirmed.update(range(first, third))
                    endings = [i for i in range(third + 3, len(doc) - 1) if chapter(texts[i], "V", "5")]
                    if not starts and len(endings) == 1:
                        end = endings[0]
                        # The public PDF may already omit all of Chapter IV. Require
                        # its table of contents and four physical page numbers to
                        # independently agree with the exact gap at Chapter V.
                        front = "\n".join(texts[:first])
                        iv = re.findall(r"^\s*BAB\s*(?:IV|4)\b[^\n]*?\.{3,}\s*(\d+)\s*$", front, re.I | re.M)
                        v = re.findall(r"^\s*BAB\s*(?:V|5)\b[^\n]*?\.{3,}\s*(\d+)\s*$", front, re.I | re.M)
                        if len(iv) == 1 and len(v) == 1 and 2 < int(iv[0]) < int(v[0]):
                            def margin_number(i):
                                lines = {}
                                rect = doc[i].rect
                                for word in raw_words[i]:
                                    lines.setdefault((word[5], word[6]), []).append(word)
                                numbers = [int(line[0][4]) for line in lines.values()
                                           if len(line) == 1 and re.fullmatch(r"\d{1,4}", line[0][4])
                                           and (line[0][1] < rect.height * .15 or line[0][3] > rect.height * .85)]
                                return numbers[0] if len(numbers) == 1 else None

                            iv_page, v_page = int(iv[0]), int(v[0])
                            expected = [iv_page - 2, iv_page - 1, v_page, v_page + 1]
                            if [margin_number(i) for i in range(end - 2, end + 2)] == expected:
                                confirmed.update(range(len(doc)))
                                coverage = "chapter-iv-already-removed"
            front_limit = min(opening[0], default=20)
            for i, text in enumerate(texts[:min(front_limit, 20)]):
                lines = text.upper().splitlines()
                start = next((line for line in lines if not re.fullmatch(r"(?:\d+|[IVXLCDM]+)", line)), "")
                if start in {"ABSTRAK", "ABSTRACT"}:
                    confirmed.add(i)
            if not confirmed:
                raise RuntimeError("Perlu peninjauan: tidak ada bagian awal skripsi yang dapat dipastikan.")
            hidden = set(range(len(doc))) - confirmed
            if coverage != "chapter-iv-already-removed":
                coverage = "verified-opening-sections"
        else:
            raise RuntimeError("Perlu peninjauan: batas Bab IV/V belum dapat dipastikan. Tidak ada halaman dipublikasikan.")

    pages = []
    for i, page in enumerate(doc):
        if i in hidden:
            continue
        rect = page.rect
        if rect.width <= 0 or rect.height <= 0 or rect.width / rect.height > 5 or rect.height / rect.width > 5:
            raise RuntimeError("Ukuran halaman tidak didukung.")
        assets = {"thumb": "", "read": "", "hd": ""}
        words = []
        if not args.text_only:
            for name, width in [("thumb", 180), ("read", 1100), ("hd", 1800)]:
                pix = page.get_pixmap(matrix=fitz.Matrix(width / rect.width, width / rect.width), alpha=False)
                image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                filename = f"{i + 1}-{name}.webp"
                image.save(root / filename, "WEBP", quality=webp_quality, method=4)
                assets[name] = filename
            for word in raw_words[i]:
                box = fitz.Rect(word[:4]) * page.rotation_matrix
                words.append({"text": word[4], "x": max(0, box.x0 / rect.width), "y": max(0, box.y0 / rect.height), "w": max(0, (box.x1 - box.x0) / rect.width), "h": max(0, (box.y1 - box.y0) / rect.height)})
        text = texts[i].strip()
        quality = "image" if len(text) < 30 else "poor" if boundary_damage(text) >= 2 else "ocr" if i in ocr_done else "text"
        label = page.get_label().replace("\0", "") or str(i + 1)
        pages.append({"number": i + 1, "label": label, "width": rect.width, "height": rect.height, "text": text, "image": assets["read"], "thumbnail": assets["thumb"], "hd": assets["hd"], "words": words, "quality": quality})
    outline = [] if args.text_only else [{"title": title.replace("\0", ""), "page": page} for _, title, page in doc.get_toc() if page > 0 and page - 1 not in hidden][:200]
    (root / "extracted.json").write_text(json.dumps({"totalPages": len(doc), "pages": pages, "outline": outline}, ensure_ascii=False))
    print(json.dumps({"pages": len(pages), "image_only": sum(p["quality"] == "image" for p in pages), "poor_text": sum(p["quality"] == "poor" for p in pages), "coverage": coverage}))


if __name__ == "__main__":
    main()
