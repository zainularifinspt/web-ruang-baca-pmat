import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { dataRoot, readerLocal } from "./store";

type Bucket = {
  key: string;
  units: number;
  limit: number;
  expires: string;
  scope: string;
};
async function secret() {
  if (
    process.env.CHAT_SESSION_SECRET?.length &&
    process.env.CHAT_SESSION_SECRET.length >= 32
  )
    return process.env.CHAT_SESSION_SECRET;
  if (!readerLocal()) throw new Error("Layanan chat belum dikonfigurasi.");
  await mkdir(dataRoot(), { recursive: true });
  const file = path.join(dataRoot(), "session.key");
  try {
    await writeFile(file, randomBytes(32).toString("hex"), {
      flag: "wx",
      mode: 0o600,
    });
  } catch {}
  return readFile(file, "utf8");
}
const digest = (key: string, value: string) =>
  createHmac("sha256", key).update(value).digest("hex");
export async function chatSession(cookie: string | undefined) {
  const key = await secret();
  const parts = cookie?.split(".") || [];
  if (
    parts.length === 2 &&
    /^[a-f0-9]{32}$/.test(parts[0]) &&
    /^[a-f0-9]{64}$/.test(parts[1]) &&
    timingSafeEqual(Buffer.from(parts[1]), Buffer.from(digest(key, parts[0])))
  )
    return { id: parts[0], cookie: cookie! };
  const id = randomBytes(16).toString("hex");
  return { id, cookie: `${id}.${digest(key, id)}` };
}
function positive(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
export async function reserveChat(
  session: string,
  network: string | null,
  reservedMicroUsd: number,
) {
  const key = await secret();
  const now = Date.now();
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
  const minute = Math.floor(now / 60000);
  const exp = new Date(now + 86400000 * 2).toISOString();
  const daily = positive(process.env.CHAT_DAILY_LIMIT, 20);
  const buckets: Bucket[] = [
    {
      key: `global-minute:${minute}`,
      units: 1,
      limit: positive(process.env.CHAT_GLOBAL_MINUTE_LIMIT, 120),
      scope: "global",
      expires: new Date(now + 120000).toISOString(),
    },
    {
      key: `s:${digest(key, session)}:${day}`,
      units: 1,
      limit: daily,
      scope: "daily",
      expires: exp,
    },
    {
      key: `m:${digest(key, session)}:${minute}`,
      units: 1,
      limit: positive(process.env.CHAT_MINUTE_LIMIT, 4),
      scope: "minute",
      expires: new Date(now + 120000).toISOString(),
    },
    {
      key: `budget:${day}`,
      units: reservedMicroUsd,
      limit: positive(process.env.CHAT_DAILY_BUDGET_CENTS, 100) * 10000,
      scope: "budget",
      expires: exp,
    },
  ];
  if (network)
    buckets.push({
      key: `ip:${digest(key, network)}:${day}`,
      units: 1,
      limit: positive(process.env.CHAT_NETWORK_DAILY_LIMIT, 100),
      scope: "network",
      expires: exp,
    });
  return reserveBuckets(buckets, daily);
}
export async function reserveChatBudget(cost: number) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const result = await reserveBuckets(
    [
      {
        key: `budget:${day}`,
        units: cost,
        limit: positive(process.env.CHAT_DAILY_BUDGET_CENTS, 100) * 10000,
        scope: "budget",
        expires: new Date(Date.now() + 86400000 * 2).toISOString(),
      },
    ],
    0,
  );
  return result.ok;
}
async function reserveBuckets(buckets: Bucket[], daily: number) {
  const now = Date.now();
  if (!readerLocal()) {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "reader_reserve_usage",
      { p_buckets: buckets },
    );
    if (error)
      throw new Error(
        "Layanan chat belum diaktifkan. Katalog dan pembaca tetap tersedia.",
      );
    return data as { ok: boolean; remaining: number };
  }
  await mkdir(dataRoot(), { recursive: true });
  const lock = path.join(dataRoot(), "quota.lock");
  let locked = false;
  for (let i = 0; i < 30; i++) {
    try {
      await mkdir(lock);
      locked = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  if (!locked) throw new Error("Layanan sedang sibuk. Coba sebentar lagi.");
  try {
    const file = path.join(dataRoot(), "usage.json");
    const usage: Record<string, { units: number; expires: string }> =
      await readFile(file, "utf8")
        .then(JSON.parse)
        .catch(() => ({}));
    for (const [k, v] of Object.entries(usage))
      if (Date.parse(v.expires) < now) delete usage[k];
    if (buckets.some((b) => (usage[b.key]?.units || 0) + b.units > b.limit))
      return { ok: false, remaining: 0 };
    let remaining = daily;
    for (const b of buckets) {
      usage[b.key] = {
        units: (usage[b.key]?.units || 0) + b.units,
        expires: b.expires,
      };
      if (b.scope === "daily") remaining = b.limit - usage[b.key].units;
    }
    await writeFile(file + ".tmp", JSON.stringify(usage), { mode: 0o600 });
    await rename(file + ".tmp", file);
    return { ok: true, remaining };
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}
