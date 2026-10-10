// FIXME: find a better way to use the raw output from wasm-pack
// instead of replacing the JS entrypoint wholesale like this

import { prepareExports } from "./deno-wasm.js";

export async function initExports() {
  const { parse, parse_frag, ...remappedImports } =
    (await import("./deno-wasm_bg-wasm.js")).default;
  remappedImports.parse_wasm = parse;
  remappedImports.parse_frag_wasm = parse_frag;

  return prepareExports(remappedImports);
}
