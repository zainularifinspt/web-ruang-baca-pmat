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

type BytesCapable = {
  bytes?: () => Promise<Uint8Array>;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

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
  defineFindLast(Array.prototype);
  defineAt(String.prototype);
  if (typeof Blob !== "undefined") defineBytes(Blob.prototype as BytesCapable);
  if (typeof Response !== "undefined") defineBytes(Response.prototype as BytesCapable);

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

function defineFindLast<T>(prototype: {
  findLast?: (
    predicate: (value: T, index: number, array: ArrayLike<T>) => unknown,
    thisArg?: unknown,
  ) => T | undefined;
} | undefined) {
  if (!prototype || prototype.findLast) return;

  Object.defineProperty(prototype, "findLast", {
    configurable: true,
    writable: true,
    value: function findLast(
      this: ArrayLike<T> | null | undefined,
      predicate: (value: T, index: number, array: ArrayLike<T>) => unknown,
      thisArg?: unknown,
    ) {
      if (this == null) {
        throw new TypeError("Array.prototype.findLast called on null or undefined");
      }

      if (typeof predicate !== "function") {
        throw new TypeError("predicate must be a function");
      }

      const object = Object(this) as ArrayLike<T>;
      const length = object.length >>> 0;
      for (let index = length - 1; index >= 0; index--) {
        const value = object[index];
        if (predicate.call(thisArg, value, index, object)) {
          return value;
        }
      }

      return undefined;
    },
  });
}

function defineBytes(prototype: BytesCapable | undefined) {
  if (!prototype || prototype.bytes) return;

  Object.defineProperty(prototype, "bytes", {
    configurable: true,
    writable: true,
    value: async function bytes(this: BytesCapable) {
      return new Uint8Array(await this.arrayBuffer());
    },
  });
}
