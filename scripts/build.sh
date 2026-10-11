#!/bin/bash
set -e

dist="./dist"
rm -rf "$dist"
mkdir -p "$dist"

# Test and build
pnpm test
pnpm -r build

# Generate tarballs files
pnpm -r --filter "@lumeland/*" pack --out "$dist/%s.tgz"
pnpm -r exec -- rm -rf build

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

# Generate tarballs again
# for dir in "$dist"/*; do
#   [ -d "$dir" ] || continue
#   pnpm pack --dir "$dir" --out "../%s.tgz"
#   rm -rf "$dir"
# done

