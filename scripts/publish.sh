#!/bin/bash
set -e

dist="./dist"

sh ./scripts/build.sh

set +e
# Publish the packages
for dir in "$dist"/*; do
  [ -d "$dir" ] || continue
  pnpm publish --access public --dir "$dir" --no-git-checks --tag beta
  rm -rf "$dir"
done