# Deno DOM Rust Crates

## Build dependencies

| tool        | version                 |
| ----------- | ----------------------- |
| `wasm-pack` | **0.13.1**              |
| `wasm2wat`  | **1.0.36 (git~1.0.37)** |
| `wat2wasm`  | **1.0.36 (git~1.0.37)** |

**Note:** `wasm2wat` and `wat2wasm` are part of the same package: "wabt" or The
WebAssembly Binary Toolkit

## Crates

These crates are for building/testing the Rust WASM and native Deno plugin code.

- `core/`: html5ever, RcDom, and direct Deno DOM bindings, common dependency for
  all other crates
- `wasm/`: WASM lib
- `plugin/`: Deno native plugin
- `cli-test/`: Basic CLI program to test the output of the parser

## Building with GNU Make

Build the WASM lib

```
make wasm
```

Build the native plugin

```
make plugin
```

Build the CLI

```
make cli
```

Build all the above

```
make
```
