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

Portions Copyright 2026 3A Systems, LLC.
-->
# Search

The site search is [DocSearch](https://docsearch.algolia.com/) on the Algolia application
`X0ME9NKL6F`, index `doc_openidentityplatform`.

- **Front end**: `@docsearch/js` 3.9.0, vendored in `supplemental-ui/js/vendor/docsearch.min.js` and
  `supplemental-ui/css/vendor/docsearch.min.css`, set up in `supplemental-ui/partials/footer-scripts.hbs`.
  It is rendered only when the build has both `ALGOLIA_SEARCH_API_KEY` and `ALGOLIA_APP_ID` in the environment.
- **Crawler**: the legacy [docsearch-scraper](https://github.com/algolia/docsearch-scraper)
  (`algolia/docsearch-scraper:v1.12.0`, no longer maintained), run with `config.json` by the "Reindex docs"
  step of `.github/workflows/publish.yml` after every deployment. How the index was set up for it:
  https://gitlab.com/antora/antora-ui-default/-/issues/44#note_579313948

## Moving the crawler to the Algolia Crawler

`crawler-config.js` is the same crawl for the [Algolia Crawler](https://www.algolia.com/doc/tools/crawler/),
which replaces the legacy scraper. It has not been run yet: it needs Crawler access on the Algolia application,
which an open-source documentation site gets through the [DocSearch program](https://docsearch.algolia.com/apply).

1. Get Crawler access for the application `X0ME9NKL6F` (or the DocSearch program).
2. Create a crawler in the Crawler dashboard and paste `crawler-config.js`; the dashboard sets `apiKey`.
   Check with its URL tester that a product start page (e.g. `/openam/`) gives records and the site home page
   does not.
3. Run it. It writes the new index `doc_openidentityplatform_v3`, so the live search keeps using the old one.
4. Check the results, e.g. by building the site with `indexName: 'doc_openidentityplatform_v3'` in
   `footer-scripts.hbs`, and schedule the crawler (or trigger it after each deployment).
5. In one pull request: switch `indexName` in `footer-scripts.hbs` to `doc_openidentityplatform_v3`, remove
   the "Reindex docs" step from `publish.yml`, and remove `config.json`. The `ALGOLIA_API_KEY` secret
   (write key of the legacy scraper) is then no longer needed.
