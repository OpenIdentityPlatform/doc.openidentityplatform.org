/*
 * The contents of this file are subject to the terms of the Common Development and
 * Distribution License (the License). You may not use this file except in compliance with the
 * License.
 *
 * You can obtain a copy of the License at legal/CDDLv1.0.txt. See the License for the
 * specific language governing permission and limitations under the License.
 *
 * When distributing Covered Software, include this CDDL Header Notice in each file and include
 * the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
 * Header, with the fields enclosed by brackets [] replaced by your own identifying
 * information: "Portions copyright [year] [name of copyright owner]".
 *
 * Copyright 2026 3A Systems, LLC.
 */

// Algolia Crawler configuration for doc.openidentityplatform.org, to replace the legacy
// docsearch-scraper run by .github/workflows/publish.yml (config.json). It is pasted into the
// Crawler dashboard, which runs it; see readme.md. It mirrors config.json: records only from the
// product pages (the site home page is crawled for links only), same exclusions, same selectors for
// the hierarchy and the content. Not carried over, because none of it changes the results: the
// version in lvl0 and the desc(version) ranking (every component has version ~), the component
// attribute (nothing reads it) and min_indexed_level. It writes a new index, so that it can be
// checked before the site switches to it.

new Crawler({
  appId: 'X0ME9NKL6F',
  // set by the Crawler dashboard; never put a write key in this repository
  apiKey: '<crawler API key>',
  rateLimit: 8,
  maxDepth: 10,
  startUrls: ['https://doc.openidentityplatform.org/'],
  sitemaps: ['https://doc.openidentityplatform.org/sitemap.xml'],
  discoveryPatterns: ['https://doc.openidentityplatform.org/**'],
  exclusionPatterns: [
    // API docs
    'https://doc.openidentityplatform.org/*/apidocs/**',
    'https://doc.openidentityplatform.org/openicf/**',
    'https://doc.openidentityplatform.org/commons/**',
    // older versions, e.g. /openam/15.2/
    'https://doc.openidentityplatform.org/*/[0-9]*.[0-9]*/**',
    // generated references that would flood the results
    'https://doc.openidentityplatform.org/opendj/reference/dsconfig-subcommands-ref',
    'https://doc.openidentityplatform.org/opendj/reference/appendix-log-messages',
    'https://doc.openidentityplatform.org/openam/reference/chap-log-messages',
  ],
  actions: [
    {
      indexName: 'doc_openidentityplatform_v3',
      // the products only, as the start_urls of config.json
      pathsToMatch: ['https://doc.openidentityplatform.org/{openam,opendj,openidm,openig}/**'],
      recordExtractor: ({ helpers }) =>
        helpers.docsearch({
          recordProps: {
            lvl0: { selectors: '.nav-panel-explore .context .title', defaultValue: 'Open Identity Platform' },
            lvl1: '.doc > h1.page',
            lvl2: '.doc .sect1 > h2',
            lvl3: '.doc .sect2 > h3',
            lvl4: '.doc .sect3 > h4',
            lvl5: '.doc .sidebarblock > .content > .title',
            content: '.doc p, .doc dt, .doc td.content, .doc th.tableblock',
          },
          indexHeadings: true,
          aggregateContent: true,
          recordVersion: 'v3',
        }),
    },
  ],
  initialIndexSettings: {
    doc_openidentityplatform_v3: {
      attributesForFaceting: ['type', 'lang'],
      attributesToRetrieve: ['hierarchy', 'content', 'anchor', 'url', 'url_without_anchor', 'type'],
      attributesToHighlight: ['hierarchy', 'content'],
      attributesToSnippet: ['content:10'],
      camelCaseAttributes: ['hierarchy', 'content'],
      searchableAttributes: [
        'unordered(hierarchy.lvl0)',
        'unordered(hierarchy.lvl1)',
        'unordered(hierarchy.lvl2)',
        'unordered(hierarchy.lvl3)',
        'unordered(hierarchy.lvl4)',
        'unordered(hierarchy.lvl5)',
        'unordered(hierarchy.lvl6)',
        'content',
      ],
      distinct: true,
      attributeForDistinct: 'url',
      customRanking: ['desc(weight.pageRank)', 'desc(weight.level)', 'asc(weight.position)'],
      ranking: ['words', 'filters', 'typo', 'attribute', 'proximity', 'exact', 'custom'],
      minWordSizefor1Typo: 3,
      minWordSizefor2Typos: 7,
      allowTyposOnNumericTokens: false,
      minProximity: 1,
      ignorePlurals: true,
      advancedSyntax: true,
      attributeCriteriaComputedByMinProximity: true,
      removeWordsIfNoResults: 'allOptional',
    },
  },
})
