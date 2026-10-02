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

# The broken links of a lychee JSON report, one per line: page <TAB> link, both relative to the
# site root. Used by check.sh and by the job summary of build.yml.

# A link to the id of its target page itself, e.g. chap-resource-conf#chap-resource-conf: Antora
# renders the page title without an id, so the browser opens the top of the page, which is where
# the link points anyway. lychee's --exclude takes no back references, so these are dropped here.
def top_of_page:
  .status.text == "Cannot find fragment"
  and (.url | split("#") | (.[0] | split("/") | last | rtrimstr(".html")) == (.[1:] | join("#")));

.error_map // {} | to_entries[] | .key as $page | .value[]
| select(top_of_page | not)
| "\($page | ltrimstr("/site/"))\t\(.url | ltrimstr("file:///site/"))"
