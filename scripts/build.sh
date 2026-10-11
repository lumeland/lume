#!/bin/bash
set -e

out="./dist-tarballs"
dist="./dist"

rm -rf "$out" "$dist"
mkdir -p "$dist"

pnpm -r --filter "@lumeland/*" pack --pack-destination "$out"

# Extract tarballs to ./dist
for tgz in "$out"/*.tgz; do
  [ -f "$tgz" ] || continue
  pkg_name="${tgz##*/}"           # remove path
  pkg_name="${pkg_name%-[0-9].*}"  # remove version and .tgz

  if [[ "$pkg_name" == "lumeland-dom" || "$pkg_name" == "lumeland-testing" ]]; then
    continue
  fi
  
  mkdir -p "$dist/$pkg_name"
  tar -xzf "$tgz" -C "$dist/$pkg_name" --strip-components=1
  rm "$tgz"
done
rm -rf $out
