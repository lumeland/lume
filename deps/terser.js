import "https://cdn.jsdelivr.net/npm/source-map@0.7.3/dist/source-map.js";
import "https://cdn.jsdelivr.net/npm/terser@5.6.1/dist/bundle.min.js";

const minify = globalThis.Terser.minify;

export { minify as default };
