#!/bin/bash
set -e

dist="./dist"
rm -rf "$dist"
mkdir -p "$dist"

# Test and build
# pnpm test
pnpm -r --filter="create-lume" build

# Generate tarballs files
pnpm -r --filter "create-lume" pack --out "$dist/%s.tgz"
pnpm -r --filter "create-lume" exec -- rm -rf build

# Extract tarballs
for tgz in "$dist"/*.tgz; do
  [ -f "$tgz" ] || continue
  out="${tgz%.tgz}"
  mkdir "$out"
  tar -xzf "$tgz" -C "$out" --strip-components=1
  rm "$tgz"
done

# Final tweaks
node scripts/build.ts
pnpm exec oxfmt dist/**/*
