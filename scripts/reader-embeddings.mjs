import { createServer } from "node:http";
import { createRequire } from "node:module";
import { pipeline } from "@huggingface/transformers";
const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
const host = process.env.READER_EMBEDDING_HOST || "127.0.0.1";
if (host !== "127.0.0.1" && !process.env.READER_EMBEDDING_KEY)
  throw Error("Kunci layanan wajib untuk akses jaringan.");
console.log("Menyiapkan model embedding multilingual lokal…");
const model = await pipeline(
  "feature-extraction",
  process.env.READER_EMBEDDING_MODEL || "Xenova/multilingual-e5-small",
  { dtype: "q8" },
);
let queue = Promise.resolve();
createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/embed") {
    res.writeHead(404).end();
    return;
  }
  if (
    process.env.READER_EMBEDDING_KEY &&
    req.headers.authorization !== `Bearer ${process.env.READER_EMBEDDING_KEY}`
  ) {
    res.writeHead(401).end();
    return;
  }
  try {
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 128000) {
        res.writeHead(413).end();
        return;
      }
    }
    const { texts } = JSON.parse(raw);
    if (
      !Array.isArray(texts) ||
      !texts.length ||
      texts.length > 16 ||
      texts.some((t) => typeof t !== "string" || t.length > 12000)
    ) {
      res.writeHead(400).end();
      return;
    }
    const task = queue.then(async () => {
      const out = await model(texts, { pooling: "mean", normalize: true });
      return out.tolist();
    });
    queue = task.then(
      () => {},
      () => {},
    );
    const embeddings = await task;
    res
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify({ embeddings }));
  } catch {
    res
      .writeHead(500, { "Content-Type": "application/json" })
      .end(JSON.stringify({ error: "Embedding gagal." }));
  }
}).listen(Number(process.env.READER_EMBEDDING_PORT || 8788), host, () =>
  console.log("Layanan embedding siap."),
);
