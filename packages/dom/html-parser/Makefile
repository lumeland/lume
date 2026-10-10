SHELL = /bin/bash

CWD := $(shell pwd)

CORE_SRC_DIR := core/src
CORE_SRC := $(wildcard $(CORE_SRC_DIR)/*.rs)

WASM_MOD_NAME := deno-wasm
WASM_OUT_DIR := $(CWD)/../build/$(WASM_MOD_NAME)
WASM_OUT := $(WASM_OUT_DIR)/$(WASM_MOD_NAME).js
WASM_SRC_DIR := wasm/src
WASM_SRC := $(wildcard $(WASM_SRC_DIR)/*.rs) $(wildcard $(WASM_SRC_DIR)/../*.js)

CLI_SRC_DIR := cli-test/src
CLI_SRC := $(wildcard $(CLI_SRC_DIR)/*.rs)
CLI_OUT := cli-test/target/release/cli-test

PLUGIN_SRC_DIR := plugin/src
PLUGIN_SRC := $(wildcard $(PLUGIN_SRC_DIR)/*.rs)
PLUGIN_OUT := $(CWD)/../target/release/libplugin.so
PLUGIN_OUT_FINAL := $(CWD)/../build/linux-x86_64/libplugin.so

.PHONY: all wasm plugin cli
all: wasm plugin cli

wasm: $(WASM_OUT)

plugin: $(PLUGIN_OUT_FINAL)

cli: $(CLI_OUT)

$(WASM_OUT): $(WASM_SRC) $(CORE_SRC)
	cd "$(WASM_SRC_DIR)"; \
	wasm-pack build --release --target deno --out-dir "$(WASM_OUT_DIR)" --out-name "$(WASM_MOD_NAME)"; \
	wat_output_fixed=$$(wasm2wat "$(WASM_OUT_DIR)/$(WASM_MOD_NAME)_bg.wasm" | sed 's|(import "__wbindgen_placeholder__"|(import "./wbg.js"|; s|(import "env"|(import "./env.js"|;'); \
	wat2wasm <(printf %s "$$wat_output_fixed") -o "$(WASM_OUT_DIR)/$(WASM_MOD_NAME)_bg.wasm"; \
	cp ../{deno-wasm{,-{dynamic,legacy}},env,wbg,deno-wasm_bg-wasm}.js "$(WASM_OUT_DIR)"; \
	: "Build WASM payload for runtimes that don't support native WASM imports"; \
	WASM_BASE64=$$( base64 -w 0 < "$(WASM_OUT_DIR)/$(WASM_MOD_NAME)_bg.wasm" ); \
	IFS= read -r -d '' ENTRY_SRC < "$(WASM_OUT_DIR)/deno-wasm_bg-wasm.js"; \
	printf %s "$${ENTRY_SRC/WASM_BASE64/"$$WASM_BASE64"}" > "$(WASM_OUT_DIR)/deno-wasm_bg-wasm.js"; \
	rm -f "$(WASM_OUT_DIR)/.gitignore";

$(PLUGIN_OUT_FINAL): $(PLUGIN_SRC) $(CORE_SRC)
	cd "$(PLUGIN_SRC_DIR)"; \
	cargo build --release; \
	mkdir -p "$$( dirname "$(PLUGIN_OUT_FINAL)" )"; \
	cp "$(PLUGIN_OUT)" "$(PLUGIN_OUT_FINAL)";

$(CLI_OUT): $(CLI_SRC) $(CORE_SRC)
	cd $(CLI_SRC_DIR); \
	cargo build --release; 

