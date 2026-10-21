#!/bin/bash
set -e

filter=${1:-"@lumeland/plugin-*"}
dist="./dist"

sh ./scripts/build.sh "$filter"

set +e
# Publish the packages
for dir in "$dist"/*; do
  [ -d "$dir" ] || continue
  pnpm publish --access public --dir "$dir" --no-git-checks
  rm -rf "$dir"
done
