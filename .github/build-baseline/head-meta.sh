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

# Checks the generated site for the robots.txt Sitemap line and the head meta tags of every
# page, and fails on any problem.
#
# Usage, from the repository root after a site build:
#   .github/build-baseline/head-meta.sh [site directory, build/site by default]

set -euo pipefail

dir=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$dir/../.." && pwd)
site=${1:-build/site}
problems=()

# Antora writes site.robots verbatim, so nothing else ties the Sitemap host to site.url
url=$(cd "$root" && node -p "require('js-yaml').load(require('fs').readFileSync('antora-playbook.yml', 'utf8')).site.url")
if ! grep -qxF "Sitemap: $url/sitemap.xml" "$site/robots.txt"; then
  problems+=("robots.txt: no line \`Sitemap: $url/sitemap.xml\`")
fi
[ -f "$site/sitemap.xml" ] || problems+=("sitemap.xml: missing")

# every page, other than a redirect page, carries exactly one of each tag; the API docs are not ours
tags=('<meta name="description"' '<meta property="og:title"' '<meta property="og:description"'
  '<meta property="og:image"' '<meta name="twitter:card"' '<meta property="og:url"')
pages=0
while IFS= read -r f; do
  # the redirect page of Antora; page text cannot carry this, Asciidoctor escapes the <
  grep -qF '<meta http-equiv="refresh"' "$f" && continue
  pages=$((pages + 1))
  for tag in "${tags[@]}"; do
    # 404.html has no canonical URL
    [ "$f" = "$site/404.html" ] && [ "$tag" = '<meta property="og:url"' ] && continue
    n=$({ grep -oF "$tag" "$f" || true; } | wc -l | tr -d ' ')
    [ "$n" -eq 1 ] || problems+=("${f#"$site/"}: $n x \`$tag\`")
  done
done < <(find "$site" \( -path "$site/openam/apidocs" -o -path "$site/opendj/apidocs" \
  -o -path "$site/openidm/apidocs" -o -path "$site/openig/apidocs" \
  -o -path "$site/openicf" -o -path "$site/commons" \) -prune -o -name '*.html' -print | LC_ALL=C sort)
[ "$pages" -gt 0 ] || problems+=("no pages found in $site")

{
  echo "## Head meta tags and robots.txt"
  echo
  echo "$pages pages checked, ${#problems[@]} problems."
  echo
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
# "${problems[@]}" of an empty array is unbound in bash 3.2 (macOS)
[ "${#problems[@]}" -eq 0 ] && exit 0
for p in "${problems[@]}"; do
  echo "- $p" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
  msg=${p//%/%25}
  echo "::error title=Head meta tags and robots.txt::${msg//$'\r'/%0D}"
done
exit 1
