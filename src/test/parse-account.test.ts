import * as assert from "assert";
import { evaluateAccountPolicy } from "../policy";

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok: ${name}`);
  } catch (e) {
    console.error(`fail: ${name}`, e);
    process.exitCode = 1;
  }
}

run("allowed list empty does not warn when email present", () => {
  const r = evaluateAccountPolicy("a@b.com", [], []);
  assert.strictEqual(r.level, "ok");
});

run("allowed list requires match", () => {
  const r = evaluateAccountPolicy("a@b.com", [], ["x@y.com"]);
  assert.strictEqual(r.level, "error");
});

run("allowed list case insensitive", () => {
  const r = evaluateAccountPolicy("A@B.com", [], ["a@b.com"]);
  assert.strictEqual(r.level, "ok");
});

run("flagged domain match", () => {
  const r = evaluateAccountPolicy("u@corp.com", ["corp.com"], []);
  assert.strictEqual(r.level, "error");
});

run("subdomain of flagged domain", () => {
  const r = evaluateAccountPolicy("u@x.corp.com", ["corp.com"], []);
  assert.strictEqual(r.level, "error");
});

run("no email is warning level", () => {
  const r = evaluateAccountPolicy(null, [], []);
  assert.strictEqual(r.level, "warning");
});
