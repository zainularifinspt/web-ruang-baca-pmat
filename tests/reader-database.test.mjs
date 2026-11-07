import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
const connection = process.env.READER_TEST_DATABASE_URL;
function sql(query) {
  return new Promise((resolve, reject) => {
    const p = spawn("psql", [
      connection,
      "-X",
      "-qAt",
      "-v",
      "ON_ERROR_STOP=1",
    ]);
    let output = "",
      error = "";
    p.stdout.on("data", (b) => (output += b));
    p.stderr.on("data", (b) => (error += b));
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0 ? resolve(output.trim()) : reject(Error(error)),
    );
    p.stdin.end(query);
  });
}
test(
  "reader migration, publication boundaries, permissions and atomic database quotas",
  { skip: !connection },
  async () => {
    const url = new URL(connection);
    assert.ok(
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
        url.pathname.endsWith("_test"),
      "Use an isolated local database ending in _test.",
    );
    assert.equal(spawnSync("psql", ["--version"]).status, 0);
    await sql(`create schema if not exists extensions;
 do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if; end $$;
 create table if not exists public.books(id text primary key); create table if not exists public.theses(id text primary key);`);
    const migration = await readFile(
      new URL(
        "../supabase/migrations/20261107_reader_chat.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await sql(migration);
    await sql(migration);
    try {
      await sql(`insert into books values ('reader-test');
  insert into reader_documents(id,collection_id,kind,title,active_revision,is_public) values ('book-reader-test','reader-test','book','Test','test-rev',true);
  insert into reader_document_versions(id,document_id,source_hash,source_url,policy,total_pages) values ('test-rev','book-reader-test','hash','https://example.org/test.pdf','public-v1-no-chapter-iv',5);
  insert into reader_pages(document_id,revision,page_number,label,width,height,text_content,image,thumbnail,hd,quality) values ('book-reader-test','test-rev',2,'2',600,800,'purposive sampling method','2-read.webp','2-thumb.webp','2-hd.webp','text');
  insert into reader_chunks(document_id,revision,id,page_number,text_content) values ('book-reader-test','test-rev','p2',2,'purposive sampling method');`);
      assert.equal(
        await sql(
          "set role service_role; select page_number from reader_search('book-reader-test','test-rev','sampling');",
        ),
        "2",
      );
      assert.equal(
        await sql(
          "set role service_role; select page_number from reader_retrieve('sampling','book-reader-test');",
        ),
        "2",
      );
      assert.equal(
        await sql(
          "select count(*) from reader_retrieve('sampling','book-reader-test',4);",
        ),
        "0",
      );
      assert.equal(
        await sql(
          "select has_table_privilege('anon','reader_pages','select');",
        ),
        "f",
      );
      assert.equal(
        await sql(
          "select has_function_privilege('anon','reader_retrieve(text,text,integer,extensions.vector)','execute');",
        ),
        "f",
      );
      await sql(
        "update reader_chunks set embedding=('[' || repeat('0,',383) || '1]')::extensions.vector where document_id='book-reader-test';",
      );
      assert.equal(
        await sql(
          "select page_number from reader_retrieve('unrelated-token','book-reader-test',null,('[' || repeat('0,',383) || '1]')::extensions.vector);",
        ),
        "2",
      );
      assert.equal(
        await sql(
          "select count(*) from reader_retrieve('unrelated-token','book-reader-test',null,('[1,' || repeat('0,',382) || '0]')::extensions.vector);",
        ),
        "0",
      );
      await sql("update books set id=id where id='reader-test';");
      assert.equal(
        await sql(
          "select count(*) from reader_search('book-reader-test','test-rev','sampling');",
        ),
        "0",
      );
      const query = `select reader_reserve_usage('[{"key":"reader-unit-test-quota","units":1,"limit":4,"scope":"daily","expires":"2099-01-01T00:00:00Z"}]')->>'ok';`;
      const responses = await Promise.all(
        Array.from({ length: 10 }, () => sql(query)),
      );
      assert.equal(responses.filter((r) => r === "true").length, 4);
    } finally {
      await sql(
        "delete from reader_documents where id='book-reader-test'; delete from books where id='reader-test'; delete from chat_usage where bucket_key='reader-unit-test-quota';",
      );
    }
  },
);
