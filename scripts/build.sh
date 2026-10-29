#!/bin/bash
set -e

filter=${1:-"@lumeland/plugin-*"}
dist="./dist"

rm -rf "$dist"
mkdir -p "$dist"

# Test, lint and build
pnpm -r --filter "$filter" test
pnpm lint
pnpm -r --filter "$filter" build

# Generate tarballs files
pnpm -r --filter "$filter" pack --out "$dist/%s.tgz"
pnpm -r --filter "$filter" exec -- rm -rf build

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
