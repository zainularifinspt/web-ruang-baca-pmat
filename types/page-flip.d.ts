declare module "page-flip" {
  export class PageFlip {
    constructor(
      element: HTMLElement,
      settings: Record<string, number | string | boolean>,
    );
    loadFromHTML(elements: HTMLElement[] | NodeListOf<HTMLElement>): void;
    turnToPage(index: number): void;
    getCurrentPageIndex(): number;
    getOrientation(): string;
    flipNext(): void;
    flipPrev(): void;
    on(event: "flip", callback: (event: { data: number }) => void): void;
    update(): void;
    destroy(): void;
  }
}
