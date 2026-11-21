import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const root = await mkdtemp(join(tmpdir(), "reader-quota-"));
const stub = (code) => ({
  url: "data:text/javascript," + encodeURIComponent(code),
  shortCircuit: true,
});
registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL?.endsWith("/lib/reader/quota.ts")) {
      if (specifier === "./store")
        return stub(
          `export const readerLocal=()=>true; export const dataRoot=()=>${JSON.stringify(root)};`,
        );
      if (specifier === "@/lib/supabase-admin")
        return stub(
          'export const createSupabaseAdminClient=()=>{throw Error("Unexpected remote call")};',
        );
    }
    return next(specifier, context);
  },
});
const { chatSession, reserveChat, reserveChatBudget } =
  await import("../lib/reader/quota.ts");
test("signed anonymous sessions, atomic quotas and cost reservations resist concurrent requests", async () => {
  const old = { ...process.env };
  process.env.CHAT_SESSION_SECRET =
    "unit-test-secret-with-at-least-32-characters";
  process.env.CHAT_MINUTE_LIMIT = "4";
  process.env.CHAT_DAILY_LIMIT = "5";
  process.env.CHAT_DAILY_BUDGET_CENTS = "1";
  try {
    const session = await chatSession();
    assert.equal((await chatSession(session.cookie)).id, session.id);
    assert.notEqual(
      (await chatSession(session.cookie.slice(0, -1) + "Z")).id,
      session.id,
    );
    const requests = await Promise.all(
      Array.from({ length: 10 }, () => reserveChat(session.id, null, 0)),
    );
    assert.equal(requests.filter((r) => r.ok).length, 4);
    assert.equal(await reserveChatBudget(9000), true);
    assert.equal(await reserveChatBudget(1001), false);
    assert.equal(await reserveChatBudget(1000), true);
    assert.equal(await reserveChatBudget(1), false);
    delete process.env.CHAT_NETWORK_DAILY_LIMIT;
    process.env.CHAT_MINUTE_LIMIT = "100";
    process.env.CHAT_DAILY_LIMIT = "100";
    const ip = "203.0.113.99";
    let ipAllowed = 0;
    for (let i = 0; i < 25; i++) {
      const s = await chatSession();
      const res = await reserveChat(s.id, ip, 0);
      if (res.ok) ipAllowed++;
    }
    assert.equal(ipAllowed, 20);
  } finally {
    process.env = old;
    await rm(root, { recursive: true, force: true });
  }
});
