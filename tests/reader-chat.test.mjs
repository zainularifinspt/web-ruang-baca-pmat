import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !specifier.endsWith(".ts")) {
      const url = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(fileURLToPath(url)))
        return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
const { answerWithDeepseek, reservedCost } =
  await import("../lib/reader/chat.ts");
const sources = [
  {
    id: "s1",
    title: "Sumber",
    url: "/baca/buku/a?page=12",
    page: 12,
    excerpt:
      "Penelitian menggunakan purposive sampling pada kelompok mahasiswa.",
  },
];
test("DeepSeek calls disable reasoning and accept only server-validated evidence", async () => {
  const old = globalThis.fetch;
  const key = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = "test-key-never-sent";
  try {
    let sent;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://api.deepseek.com/chat/completions");
      sent = JSON.parse(options.body);
      return Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                paragraphs: ["Penelitian menggunakan purposive sampling."],
                citations: [
                  {
                    id: "s1",
                    quote: "Penelitian menggunakan purposive sampling",
                  },
                ],
              }),
            },
          },
        ],
      });
    };
    const answer = await answerWithDeepseek("Metodenya apa?", sources, []);
    assert.ok(answer);
    assert.equal(sent.thinking.type, "disabled");
    assert.equal(sent.max_tokens, 700);
    assert.equal(sent.response_format.type, "json_object");
    assert.ok(reservedCost("Metodenya apa?", sources, []) > 0);
    globalThis.fetch = async () =>
      Response.json({
        choices: [{ finish_reason: "length", message: { content: "{}" } }],
      });
    assert.equal(await answerWithDeepseek("Metodenya apa?", sources, []), null);
    globalThis.fetch = async () =>
      Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                paragraphs: ["Jawaban tanpa bukti."],
                citations: [
                  {
                    id: "unknown",
                    quote: "Penelitian menggunakan purposive sampling",
                  },
                ],
              }),
            },
          },
        ],
      });
    assert.equal(await answerWithDeepseek("Metodenya apa?", sources, []), null);
  } finally {
    globalThis.fetch = old;
    if (key === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = key;
  }
});
