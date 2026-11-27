<!--
The contents of this file are subject to the terms of the Common Development and
Distribution License (the License). You may not use this file except in compliance with the
License.

You can obtain a copy of the License at legal/CDDLv1.0.txt. See the License for the
specific language governing permission and limitations under the License.

When distributing Covered Software, include this CDDL Header Notice in each file and include
the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
Header, with the fields enclosed by brackets [] replaced by your own identifying
information: "Portions copyright [year] [name of copyright owner]".

Copyright 2025-2026 3A Systems, LLC.
-->
# Search

Site search uses [Pagefind](https://pagefind.app/). The Antora extension in `lib/pagefind.js` indexes the
article content of the current OpenAM, OpenDJ, OpenIDM, and OpenIG documentation. It excludes archived
versions and the generated command and log references listed in the extension. Javadoc is copied after
Antora runs, so it stays outside the search index.

Antora publishes the index and search UI in `build/site/pagefind/`. The browser searches those static
files. To test locally, run `npm ci` and `npm run buildAllAndRun` from the repository root, then open the
site over HTTP. Open search from the header or press Cmd+K or Ctrl+K.
