"use client";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import type { PageFlip } from "page-flip";
import type { ReaderManifest, ReaderWord } from "@/lib/reader/types";
export type FlipHandle = {
  go: (number: number) => void;
  next: () => void;
  prev: () => void;
};
type Props = {
  manifest: ReaderManifest;
  initialPage: number;
  zoom: number;
  vertical: boolean;
  highlight?: { page: number; words: ReaderWord[] };
  onPage: (number: number) => void;
};
export const FlipStage = forwardRef<FlipHandle, Props>(function FlipStage(
  { manifest, initialPage, zoom, vertical, highlight, onPage },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  const engine = useRef<PageFlip | null>(null);
  const nodes = useRef<HTMLElement[]>([]);
  const selected = useRef(initialPage);
  const onChange = useRef(onPage);
  onChange.current = onPage;
  const settings = useRef({ zoom, highlight });
  settings.current = { zoom, highlight };
  const refresh = useRef<(index: number) => void>(() => {});
  useImperativeHandle(
    ref,
    () => ({
      go(number) {
        const index = manifest.pages.findIndex((p) => p.number === number);
        if (index < 0) return;
        selected.current = number;
        if (engine.current) engine.current.turnToPage(index);
        else {
          nodes.current.forEach((n, i) => {
            n.style.display = i === index ? "block" : "none";
          });
        }
        refresh.current(index);
        onChange.current(number);
      },
      next() {
        if (engine.current) engine.current.flipNext();
        else {
          const i = manifest.pages.findIndex(
            (p) => p.number === selected.current,
          );
          const next = manifest.pages[i + 1];
          if (next) {
            selected.current = next.number;
            nodes.current.forEach((n, j) => {
              n.style.display = j === i + 1 ? "block" : "none";
            });
            refresh.current(i + 1);
            onChange.current(next.number);
          }
        }
      },
      prev() {
        if (engine.current) engine.current.flipPrev();
        else {
          const i = manifest.pages.findIndex(
            (p) => p.number === selected.current,
          );
          const prev = manifest.pages[i - 1];
          if (prev) {
            selected.current = prev.number;
            nodes.current.forEach((n, j) => {
              n.style.display = j === i - 1 ? "block" : "none";
            });
            refresh.current(i - 1);
            onChange.current(prev.number);
          }
        }
      },
    }),
    [manifest],
  );
  useEffect(() => {
    const container = root.current;
    if (!container) return;
    let cancelled = false;
    let pageFlip: PageFlip | null = null;
    let resizeCleanup = () => {};
    const book = document.createElement("div");
    book.className = "flip-book";
    container.appendChild(book);
    nodes.current = manifest.pages.map((p) => {
      const node = document.createElement("div");
      node.className = "flip-page";
      node.setAttribute("aria-label", `Halaman PDF ${p.number}`);
      book.appendChild(node);
      return node;
    });
    const paperRatio =
      manifest.pages.find((p) => p.number === selected.current) ||
      manifest.pages[0];
    const baseRatio = paperRatio.width / paperRatio.height;
    refresh.current = (index) => {
      if (engine.current) index = engine.current.getCurrentPageIndex();
      const visible =
        vertical ||
        (engine.current
          ? engine.current.getOrientation() === "portrait"
          : window.innerWidth < 768)
          ? 1
          : 2;
      const ahead = window.matchMedia("(max-width: 767px)").matches ? 2 : 4;
      nodes.current.forEach((node, i) => {
        node.setAttribute(
          "aria-hidden",
          i >= index && i < index + visible ? "false" : "true",
        );
        if (i < index - 1 || i > index + ahead) {
          node.replaceChildren();
          return;
        }
        const page = manifest.pages[i];
        const src = settings.current.zoom > 1.15 ? page.hd : page.image;
        let image = node.querySelector("img");
        if (!image) {
          image = document.createElement("img");
          image.alt = `Halaman ${page.label} — ${manifest.title}`;
          image.draggable = false;
          image.decoding = "async";
          image.className = "flip-page-image";
          node.appendChild(image);
        }
        if (image.getAttribute("src") !== src) image.src = src;
        node.querySelector(".flip-highlights")?.remove();
        if (settings.current.highlight?.page === page.number) {
          const layer = document.createElement("div");
          layer.className = "flip-highlights";
          const ratio = page.width / page.height;
          if (ratio > baseRatio) {
            layer.style.height = `${(baseRatio / ratio) * 100}%`;
            layer.style.top = `${(1 - baseRatio / ratio) * 50}%`;
          } else {
            layer.style.width = `${(ratio / baseRatio) * 100}%`;
            layer.style.left = `${(1 - ratio / baseRatio) * 50}%`;
          }
          layer.setAttribute("aria-hidden", "true");
          for (const word of settings.current.highlight.words) {
            const mark = document.createElement("mark");
            Object.assign(mark.style, {
              left: `${word.x * 100}%`,
              top: `${word.y * 100}%`,
              width: `${word.w * 100}%`,
              height: `${word.h * 100}%`,
            });
            layer.appendChild(mark);
          }
          node.appendChild(layer);
        }
      });
    };
    const initial = Math.max(
      0,
      manifest.pages.findIndex((p) => p.number === selected.current),
    );
    refresh.current(initial);
    if (vertical) {
      nodes.current.forEach((n, i) => {
        n.style.display = i === initial ? "block" : "none";
      });
      book.classList.add("flip-book-single");
      book.style.aspectRatio = String(baseRatio);
    } else
      void import("page-flip").then(({ PageFlip }) => {
        if (cancelled) return;
        const first = manifest.pages[initial];
        const ratio = first.width / first.height;
        const available = Math.max(240, container.clientWidth - 32);
        const height = Math.min(container.clientHeight - 32, 900);
        const single = available < 660;
        const width = Math.max(
          130,
          Math.min(single ? available : available / 2, height * ratio),
        );
        pageFlip = new PageFlip(book, {
          width,
          height: width / ratio,
          size: "stretch",
          minWidth: single ? Math.min(330, width) : Math.min(280, width * 0.8),
          maxWidth: Math.max(180, height * ratio),
          minHeight: 180,
          maxHeight: Math.max(260, height),
          autoSize: true,
          showCover: false,
          usePortrait: true,
          flippingTime: 450,
          maxShadowOpacity: 0.22,
          mobileScrollSupport: true,
          useMouseEvents: true,
          startPage: initial,
        });
        engine.current = pageFlip;
        pageFlip.loadFromHTML(nodes.current);
        refresh.current(initial);
        const observer = new ResizeObserver(() => {
          pageFlip?.update();
          refresh.current(pageFlip?.getCurrentPageIndex() || 0);
        });
        observer.observe(container);
        resizeCleanup = () => observer.disconnect();
        pageFlip.on("flip", (event) => {
          const index = Number(event.data);
          if (!manifest.pages[index]) return;
          selected.current = manifest.pages[index].number;
          refresh.current(index);
          onChange.current(selected.current);
        });
      });
    return () => {
      cancelled = true;
      engine.current = null;
      resizeCleanup();
      pageFlip?.destroy();
      book.remove();
      nodes.current = [];
    };
  }, [manifest, vertical]);
  useEffect(() => {
    const i = manifest.pages.findIndex((p) => p.number === selected.current);
    refresh.current(Math.max(0, i));
  }, [zoom, highlight, manifest]);
  return (
    <div
      className={`flip-stage ${vertical ? "is-vertical" : ""}`}
      ref={root}
      style={{ "--reader-zoom": zoom } as React.CSSProperties}
    />
  );
});
