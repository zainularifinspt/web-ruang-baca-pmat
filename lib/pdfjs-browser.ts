type PromiseWithResolvers = typeof Promise & {
  withResolvers?: <T>() => {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  };
};

type ConstructorName =
  | "Int8Array"
  | "Uint8Array"
  | "Uint8ClampedArray"
  | "Int16Array"
  | "Uint16Array"
  | "Int32Array"
  | "Uint32Array"
  | "Float32Array"
  | "Float64Array"
  | "BigInt64Array"
  | "BigUint64Array";

installPdfJsBrowserPolyfills();

export async function loadPdfJs() {
  installPdfJsBrowserPolyfills();

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  return pdfjs;
}

function installPdfJsBrowserPolyfills() {
  const promiseConstructor = Promise as PromiseWithResolvers;

  if (!promiseConstructor.withResolvers) {
    Object.defineProperty(Promise, "withResolvers", {
      configurable: true,
      writable: true,
      value: function withResolvers<T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: unknown) => void;
        const promise = new Promise<T>((promiseResolve, promiseReject) => {
          resolve = promiseResolve;
          reject = promiseReject;
        });

        return { promise, resolve, reject };
      },
    });
  }

  defineAt(Array.prototype);
  defineAt(String.prototype);

  const typedArrayNames: ConstructorName[] = [
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    "BigInt64Array",
    "BigUint64Array",
  ];

  for (const name of typedArrayNames) {
    const constructor = globalThis[name];
    if (constructor) defineAt(constructor.prototype);
  }
}

function defineAt(prototype: { at?: (index: number) => unknown } | undefined) {
  if (!prototype || prototype.at) return;

  Object.defineProperty(prototype, "at", {
    configurable: true,
    writable: true,
    value: function at(this: { length: number; [key: number]: unknown }, index: number) {
      const length = this.length >>> 0;
      const integerIndex = Number(index) || 0;
      const relativeIndex = integerIndex < 0 ? Math.ceil(integerIndex) : Math.floor(integerIndex);
      const resolvedIndex = relativeIndex < 0 ? length + relativeIndex : relativeIndex;

      return resolvedIndex < 0 || resolvedIndex >= length ? undefined : this[resolvedIndex];
    },
  });
}
