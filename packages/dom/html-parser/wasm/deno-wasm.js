// FIXME: find a better way to use the raw output from wasm-pack
// instead of replacing the JS entrypoint wholesale like this

export function prepareExports(wasmImports) {
  const {
    memory,
    __wbindgen_export_0,
    __wbindgen_malloc,
    __wbindgen_realloc,
    __wbindgen_free,
    parse_wasm,
    parse_frag_wasm,
  } = wasmImports;

  {
    const table = __wbindgen_export_0;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
  }

  let WASM_VECTOR_LEN = 0;

  let cachedUint8ArrayMemory0 = null;

  function getUint8ArrayMemory0() {
    if (
      cachedUint8ArrayMemory0 === null ||
      cachedUint8ArrayMemory0.byteLength === 0
    ) {
      cachedUint8ArrayMemory0 = new Uint8Array(memory.buffer);
    }
    return cachedUint8ArrayMemory0;
  }

  const cachedTextEncoder = typeof TextEncoder !== "undefined"
    ? new TextEncoder("utf-8")
    : {
      encode: () => {
        throw Error("TextEncoder not available");
      },
    };

  const encodeString = function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
  };

  function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
      const buf = cachedTextEncoder.encode(arg);
      const ptr = malloc(buf.length, 1) >>> 0;
      getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
      WASM_VECTOR_LEN = buf.length;
      return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
      const code = arg.charCodeAt(offset);
      if (code > 0x7F) break;
      mem[ptr + offset] = code;
    }

    if (offset !== len) {
      if (offset !== 0) {
        arg = arg.slice(offset);
      }
      ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
      const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
      const ret = encodeString(arg, view);

      offset += ret.written;
      ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
  }

  const cachedTextDecoder = typeof TextDecoder !== "undefined"
    ? new TextDecoder("utf-8", { ignoreBOM: true, fatal: true })
    : {
      decode: () => {
        throw Error("TextDecoder not available");
      },
    };

  if (typeof TextDecoder !== "undefined") cachedTextDecoder.decode();

  function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(
      getUint8ArrayMemory0().subarray(ptr, ptr + len),
    );
  }

  /**
   * @param {string} html
   * @returns {string}
   */
  function parse(html) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ptr0 = passStringToWasm0(
        html,
        __wbindgen_malloc,
        __wbindgen_realloc,
      );
      const len0 = WASM_VECTOR_LEN;
      const ret = parse_wasm(ptr0, len0);
      deferred2_0 = ret[0];
      deferred2_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      __wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }

  /**
   * @param {string} html
   * @param {string} context_local_name
   * @returns {string}
   */
  function parse_frag(html, context_local_name) {
    let deferred3_0;
    let deferred3_1;
    try {
      const ptr0 = passStringToWasm0(
        html,
        __wbindgen_malloc,
        __wbindgen_realloc,
      );
      const len0 = WASM_VECTOR_LEN;
      const ptr1 = passStringToWasm0(
        context_local_name,
        __wbindgen_malloc,
        __wbindgen_realloc,
      );
      const len1 = WASM_VECTOR_LEN;
      const ret = parse_frag_wasm(ptr0, len0, ptr1, len1);
      deferred3_0 = ret[0];
      deferred3_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      __wbindgen_free(deferred3_0, deferred3_1, 1);
    }
  }

  return { parse, parse_frag };
}
