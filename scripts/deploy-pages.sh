#!/usr/bin/env bash
# Rebuild the static site and force-push the gh-pages branch.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GITHUB_PAGES=true npm run build

STAGE="$(mktemp -d)"
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

cp -R "$ROOT/out/." "$STAGE/"
touch "$STAGE/.nojekyll"

git -C "$STAGE" init
git -C "$STAGE" checkout -b gh-pages
git -C "$STAGE" add -A
git -C "$STAGE" -c user.name="Cursor Agent" -c user.email="cursoragent@cursor.com" commit -m "Deploy GitHub Pages"
git -C "$STAGE" remote add github https://github.com/icywang11/campus-2027-tracker.git
git -C "$STAGE" push -f github gh-pages
