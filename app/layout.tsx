import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { WebsiteVisitTracker } from "@/components/website-visit-tracker";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ruang Baca Jurusan Pendidikan Matematika ULM",
  description:
    "Portal katalog, presensi, dan ruang baca Jurusan Pendidikan Matematika Universitas Lambung Mangkurat.",
};

const browserCompatPolyfills = `
  (function () {
    if (!Promise.withResolvers) {
      Object.defineProperty(Promise, "withResolvers", {
        configurable: true,
        writable: true,
        value: function withResolvers() {
          var resolve;
          var reject;
          var promise = new Promise(function (promiseResolve, promiseReject) {
            resolve = promiseResolve;
            reject = promiseReject;
          });
          return { promise: promise, resolve: resolve, reject: reject };
        }
      });
    }

    function defineAt(prototype) {
      if (!prototype || prototype.at) return;
      Object.defineProperty(prototype, "at", {
        configurable: true,
        writable: true,
        value: function at(index) {
          var length = this.length >>> 0;
          var integerIndex = Number(index) || 0;
          var relativeIndex = integerIndex < 0 ? Math.ceil(integerIndex) : Math.floor(integerIndex);
          var resolvedIndex = relativeIndex < 0 ? length + relativeIndex : relativeIndex;
          return resolvedIndex < 0 || resolvedIndex >= length ? undefined : this[resolvedIndex];
        }
      });
    }

    defineAt(Array.prototype);
    defineAt(String.prototype);
    [
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
      "BigUint64Array"
    ].forEach(function (name) {
      if (typeof window[name] !== "undefined") {
        defineAt(window[name].prototype);
      }
    });
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.className}>
      <head>
        <Script
          id="browser-compat-polyfills"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: browserCompatPolyfills }}
        />
      </head>
      <body>
        <WebsiteVisitTracker />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
