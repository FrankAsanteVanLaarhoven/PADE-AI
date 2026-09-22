import assert from "node:assert/strict";
import test from "node:test";
import { assertListenAllowed, isLoopback } from "./bind.ts";

test("loopback without a token is allowed", () => {
  assert.equal(isLoopback("127.0.0.1"), true);
  assert.doesNotThrow(() => assertListenAllowed("127.0.0.1", ""));
});

test("a public bind without a token is refused", () => {
  assert.throws(() => assertListenAllowed("0.0.0.0", ""), /PADE_OPERATOR_TOKEN/);
  assert.doesNotThrow(() => assertListenAllowed("0.0.0.0", "secret"));
});
