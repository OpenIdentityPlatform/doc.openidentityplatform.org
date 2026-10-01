#!/usr/bin/env bash
#
# The contents of this file are subject to the terms of the Common Development and
# Distribution License (the License). You may not use this file except in compliance with the
# License.
#
# You can obtain a copy of the License at legal/CDDLv1.0.txt. See the License for the
# specific language governing permission and limitations under the License.
#
# When distributing Covered Software, include this CDDL Header Notice in each file and include
# the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
# Header, with the fields enclosed by brackets [] replaced by your own identifying
# information: "Portions copyright [year] [name of copyright owner]".
#
# Copyright 2026 3A Systems, LLC.

# Compares the Antora errors and the broken links of a site build with the known ones listed in
# this directory, and fails on any new one. The known ones come from the product repositories and
# are fixed there; a known one that is gone is reported so that it is removed from the list.
#
# Usage, from the repository root after a build that wrote build/antora.log (Antora JSON log) and
# build/lychee.json (lychee JSON report):
#   .github/build-baseline/check.sh            check against the known lists
#   .github/build-baseline/check.sh --update   rewrite the known lists from this build

set -euo pipefail

dir=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$dir/../.." && pwd)
update=false
[ "${1:-}" = --update ] && update=true

# file <TAB> message, the file relative to the repository root
antora_errors() {
  jq -r --arg root "$root/" 'select(.level == "error" or .level == "fatal")
    | "\(.file.path // "" | ltrimstr($root))\t\(.msg)"' "$root/build/antora.log" | LC_ALL=C sort
}

# page <TAB> link, both relative to the site root
broken_links() {
  jq -r '.error_map // {} | to_entries[] | .key as $page | .value[]
    | "\($page | ltrimstr("/site/"))\t\(.url | ltrimstr("file:///site/"))"' "$root/build/lychee.json" | LC_ALL=C sort -u
}

failed=false

compare() {
  local title=$1 file=$dir/$2 current=$3 new fixed
  if $update; then
    {
      echo "# Known $title of the site build, one per line: $4."
      echo "# Written by .github/build-baseline/check.sh --update; the build fails on any other."
      printf '%s\n' "$current" | sed '/^$/d'
    } > "$file"
    echo "$file: $(printf '%s\n' "$current" | sed '/^$/d' | wc -l | tr -d ' ') entries"
    return
  fi
  local known
  known=$({ grep -v '^#' "$file" || true; } | LC_ALL=C sort)
  new=$(LC_ALL=C comm -23 <(printf '%s\n' "$current" | sed '/^$/d') <(printf '%s\n' "$known" | sed '/^$/d'))
  fixed=$(LC_ALL=C comm -13 <(printf '%s\n' "$current" | sed '/^$/d') <(printf '%s\n' "$known" | sed '/^$/d'))
  {
    echo "### $title"
    echo
    echo "$(printf '%s' "$new" | grep -c . || true) new, $(printf '%s' "$fixed" | grep -c . || true) no longer found."
    echo
  } >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    msg=${line//%/%25}
    echo "::error title=New $title::${msg//$'\t'/ — }"
    echo "- new: \`${line//$'\t'/\` — \`}\`" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
    failed=true
  done <<< "$new"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    msg=${line//%/%25}
    echo "::notice title=No longer found; remove from .github/build-baseline/$2::${msg//$'\t'/ — }"
    echo "- no longer found (remove from \`$2\`): \`${line//$'\t'/\` — \`}\`" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
  done <<< "$fixed"
  echo >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
}

# assigned first, so that a missing or malformed input stops the script (set -e) instead of
# reading as an empty build
errors=$(antora_errors)
links=$(broken_links)
$update || echo "## Compared with the known problems" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
compare "Antora errors" antora-errors.txt "$errors" "file <TAB> message"
compare "broken links" broken-links.txt "$links" "page <TAB> link"

if $failed; then
  echo "The build has new Antora errors or broken links, see above. Fix them; if they come from a" \
    "product repository, report them there and add them to .github/build-baseline." >&2
  exit 1
fi
