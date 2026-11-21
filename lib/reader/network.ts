import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export function allowedPdfUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  )
    throw new Error("Sumber PDF harus HTTPS yang diizinkan.");
  const configured = (
    process.env.READER_ALLOWED_PDF_HOSTS ||
    "ruangbaca-pdf.zainularifin9195.workers.dev"
  )
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabase) configured.push(new URL(supabase).hostname);
  const hosts = new Set([
    "drive.google.com",
    "drive.usercontent.google.com",
    "docs.google.com",
    ...configured,
  ]);
  if (!hosts.has(url.hostname.toLowerCase()))
    throw new Error("Host sumber PDF belum diizinkan.");
  return url;
}
function privateIp(ip: string) {
  if (ip.includes(":")) return !/^[23][0-9a-f]{3}:/i.test(ip);
  const n = ip.split(".").map(Number);
  return (
    n[0] === 0 ||
    n[0] === 10 ||
    n[0] === 127 ||
    n[0] >= 224 ||
    (n[0] === 169 && n[1] === 254) ||
    (n[0] === 172 && n[1] >= 16 && n[1] <= 31) ||
    (n[0] === 192 && n[1] === 168) ||
    (n[0] === 100 && n[1] >= 64 && n[1] <= 127)
  );
}
export async function downloadPdf(source: string) {
  let url = allowedPdfUrl(source);
  const drive =
    url.hostname === "drive.google.com" &&
    (url.pathname.match(/\/d\/([^/]+)/)?.[1] || url.searchParams.get("id"));
  if (drive)
    url = allowedPdfUrl(
      `https://drive.usercontent.google.com/download?id=${encodeURIComponent(drive)}&export=download&confirm=t`,
    );
  for (let redirect = 0; redirect < 5; redirect++) {
    const ips = isIP(url.hostname)
      ? [{ address: url.hostname }]
      : await lookup(url.hostname, { all: true });
    if (!ips.length || ips.some((i) => privateIp(i.address)))
      throw new Error("Alamat jaringan sumber tidak diizinkan.");
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(60000),
    });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get("location");
      await response.body?.cancel();
      if (!next) throw new Error("Pengalihan sumber tidak valid.");
      url = allowedPdfUrl(new URL(next, url).toString());
      continue;
    }
    if (!response.ok || !response.body)
      throw new Error(`Sumber PDF gagal diambil (${response.status}).`);
    const max =
      Math.min(250, Math.max(1, Number(process.env.READER_MAX_PDF_MB) || 150)) *
      1024 *
      1024;
    if (Number(response.headers.get("content-length")) > max) {
      await response.body.cancel();
      throw new Error("PDF melebihi batas ukuran pemrosesan.");
    }
    const reader = response.body.getReader();
    const buffers: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel();
        throw new Error("PDF melebihi batas ukuran pemrosesan.");
      }
      buffers.push(value);
    }
    const data = Buffer.concat(buffers);
    if (!data.subarray(0, 1024).toString().includes("%PDF-"))
      throw new Error("Sumber tidak mengembalikan file PDF.");
    return data;
  }
  throw new Error("Terlalu banyak pengalihan sumber PDF.");
}
