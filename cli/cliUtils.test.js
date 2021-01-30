import { assert, assertThrows } from "../deps/asserts.js";
import { validateArgsCount } from "./cliUtils.js";

Deno.test("valid counts don't throw", () => {
  validateArgsCount(["build"], 1);
  validateArgsCount(["run", "script"], 2);

  assert(true); // just ensure it makes it here without throwing
});

assertThrows(() => {
  validateArgsCount(["build", "the", "world"], 1);
});
