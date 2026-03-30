import * as assert from "assert";
import {
  longestPrefixFolderKey,
  normalizeAllowedEmailsList,
  resolveAllowedEmails,
} from "../resolve-allowed-emails";

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok: ${name}`);
  } catch (e) {
    console.error(`fail: ${name}`, e);
    process.exitCode = 1;
  }
}

run("normalizeAllowedEmailsList trims and drops blanks", () => {
  assert.deepStrictEqual(
    normalizeAllowedEmailsList([" a@b.com ", "", "  ", "x@y.com"]),
    ["a@b.com", "x@y.com"],
  );
});

run("non-empty merged allowedEmails wins over expectedByFolder", () => {
  const r = resolveAllowedEmails(
    ["a@b.com"],
    { "/home/work": { allowedEmails: ["other@x.com"] } },
    "/home/work/proj",
  );
  assert.deepStrictEqual(r.allowedEmails, ["a@b.com"]);
  assert.strictEqual(r.sourceHint, "settings");
});

run("empty merged uses longest expectedByFolder prefix", () => {
  const map = {
    "/home": { allowedEmails: ["wrong@x.com"] },
    "/home/work": { allowedEmails: ["work@corp.com"] },
  };
  const r = resolveAllowedEmails([], map, "/home/work/myproject");
  assert.deepStrictEqual(r.allowedEmails, ["work@corp.com"]);
  assert.strictEqual(r.sourceHint, "expectedByFolder");
  assert.strictEqual(r.matchedFolderKey, "/home/work");
});

run("no map match yields empty list", () => {
  const r = resolveAllowedEmails(
    [],
    { "/other": { allowedEmails: ["a@b.com"] } },
    "/home/me",
  );
  assert.deepStrictEqual(r.allowedEmails, []);
  assert.strictEqual(r.sourceHint, "none");
});

run("longestPrefixFolderKey picks longest prefix", () => {
  const keys = ["/a", "/a/b", "/a/b/c"];
  assert.strictEqual(longestPrefixFolderKey("/a/b/c/d", keys), "/a/b/c");
});

run("exact folder path matches key", () => {
  const keys = ["/a/b"];
  assert.strictEqual(longestPrefixFolderKey("/a/b", keys), "/a/b");
});
