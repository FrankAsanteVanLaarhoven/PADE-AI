import assert from "node:assert/strict";
import test from "node:test";
import { resolveOperator, signAudit } from "./operator.ts";

test("a local process keeps the actor from the request", () => {
  assert.equal(resolveOperator(undefined, "local-operator", "", "operator"), "local-operator");
});

test("a configured token replaces the request actor and rejects a missing bearer", () => {
  assert.throws(() => resolveOperator(undefined, "local-operator", "secret", "ada"), /token is required/);
  assert.equal(resolveOperator("Bearer secret", "someone-else", "secret", "ada"), "ada");
});

test("audit signatures cover the actor and the action", () => {
  const event = { at: "2026-09-22T12:00:00.000Z", actor: "ada", action: "admit", subjectKind: "demonstration", subjectId: "DAR-smp-1" };
  const signature = signAudit("secret", event);
  assert.equal(signature, signAudit("secret", event));
  assert.notEqual(signature, signAudit("other", event));
});
