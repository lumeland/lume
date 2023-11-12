import { initialize, svg2png } from "npm:svg2png-wasm@1.4.1";
import { read } from "../core/utils/read.ts";

// Initialize the WASM module
const url = "https://unpkg.com/svg2png-wasm@1.4.1/svg2png_wasm_bg.wasm";
const wasm = await read(url, true);
await initialize(wasm);

export { svg2png };
