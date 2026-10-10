const imports = {
  "./env.js": { now: performance.now },
  "./wbg.js": { __wbindgen_init_externref_table() {} },
};

const moduleBytes = Uint8Array.from(
  atob("WASM_BASE64"),
  (c) => c.charCodeAt(0),
);
const { instance } = await WebAssembly.instantiate(moduleBytes, imports);

export default instance.exports;
