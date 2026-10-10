// FIXME: find a better way to use the raw output from wasm-pack
// instead of replacing the JS entrypoint wholesale like this

import { prepareExports } from "./deno-wasm.js";

function hasSuitableDenoVersion(version) {
  const [major, minor] = version.split(".").map(Number);
  return major >= 2 && minor >= 1;
}

const wasmImports = await (async () => {
  let moduleImports;

  if (
    typeof Deno === "object" &&
    hasSuitableDenoVersion(Deno.version?.deno || "0.0.0")
  ) {
    moduleImports = await import("./deno-wasm_bg.wasm");
  } else {
    moduleImports = (await import("./deno-wasm_bg-wasm.js")).default;
  }

  const { parse, parse_frag, ...remappedImports } = moduleImports;
  remappedImports.parse_wasm = parse;
  remappedImports.parse_frag_wasm = parse_frag;

  return remappedImports;
})();

export const { parse, parse_frag } = prepareExports(wasmImports);
