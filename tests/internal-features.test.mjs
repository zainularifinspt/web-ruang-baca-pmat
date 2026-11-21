import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  internalFeatures,
  isInactiveInternalPath,
  inactiveFeatureMessage,
} from "../lib/internal-features.ts";

// Any disabled action must stop before opening an authenticated/database client.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      ["@/lib/supabase-admin", "@/lib/supabase-auth-server"].includes(specifier)
    ) {
      return {
        url:
          "data:text/javascript," +
          encodeURIComponent(
            'export function createSupabaseAdminClient(){ throw new Error("Database must not be accessed"); } export function createSupabaseServerClient(){ throw new Error("Auth must not be accessed"); }',
          ),
        shortCircuit: true,
      };
    }
    if (specifier.startsWith("@/")) {
      const base = new URL("../" + specifier.slice(2), import.meta.url);
      for (const extension of [".ts", ".tsx"]) {
        const url = new URL(base.href + extension);
        if (existsSync(fileURLToPath(url)))
          return { url: url.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

const { requireActiveStaffRole } = await import("../lib/auth-guards.ts");

test("inactive workflow routes include descendants, with exact segment boundaries", () => {
  for (const path of [
    "/admin/peminjaman",
    "/admin/loans",
    "/admin/submissions",
    "/admin/whatsapp-petugas",
    "/dashboard/verifikasi",
    "/dashboard/whatsapp",
  ]) {
    assert.equal(isInactiveInternalPath(path), true);
    assert.equal(isInactiveInternalPath(path + "/old-record"), true);
    assert.equal(isInactiveInternalPath(path + "-other"), false);
  }
});

test("active admin surfaces remain reachable", () => {
  for (const path of [
    "/dashboard",
    "/dashboard/katalog",
    "/dashboard/presensi",
    "/dashboard/laporan",
    "/dashboard/pengguna",
    "/dashboard/profil",
    "/dashboard/permissions",
    "/petugas",
    "/katalog",
  ]) {
    assert.equal(isInactiveInternalPath(path), false);
  }
});

test("disabled workflow guard rejects every staff role before any data access", async () => {
  for (const feature of ["loans", "verification", "whatsapp"]) {
    assert.equal(internalFeatures[feature], false);
    for (const role of ["admin", "dosen", "petugas"]) {
      assert.deepEqual(await requireActiveStaffRole(feature, [role]), {
        ok: false,
        message: inactiveFeatureMessage,
      });
    }
  }
});
