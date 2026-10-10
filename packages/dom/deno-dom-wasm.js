/**
 * @module
 *
 * This module exposes the Deno DOM API with the WASM (Web Assembly) backend
 *
 * @example
 * ```typescript
 * import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";
 *
 * const doc = new DOMParser().parseFromString(
 *   `
 *     <h1>Hello World!</h1>
 *     <p>Hello from <a href="https://deno.land/">Deno!</a></p>
 *   `,
 *   "text/html",
 * );
 *
 * const p = doc.querySelector("p")!;
 * console.log(p.textContent); // "Hello from Deno!"
 * ```
 */ import { parse, parse_frag } from "./build/deno-wasm/deno-wasm-dynamic.js";
import { register } from "./src/parser.js";
register(parse, parse_frag);
export * from "./src/api.js";
//# sourceMappingURL=deno-dom-wasm.js.map