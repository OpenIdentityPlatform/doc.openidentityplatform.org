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

'use strict'

const components = new Set(['openam', 'opendj', 'openidm', 'openig'])
const excludedPages = new Set([
  'openam/reference/chap-log-messages.adoc',
  'opendj/reference/appendix-log-messages.adoc',
  'opendj/reference/dsconfig-subcommands-ref.adoc',
])

module.exports.register = function () {
  const logger = this.getLogger('pagefind')
  this.on('beforePublish', async ({ contentCatalog, siteCatalog }) => {
    // The unversioned pages are the current documentation. Javadoc is copied after Antora runs.
    const pages = contentCatalog.getPages(({ out, src }) =>
      out && !src.version && components.has(src.component) &&
      !excludedPages.has(`${src.component}/${src.module}/${src.relative}`))
    if (!pages.length) throw new Error('Pagefind found no current documentation pages')

    const pagefind = await import('pagefind')
    try {
      const { index } = check(await pagefind.createIndex({ rootSelector: 'article.doc', forceLanguage: 'en' }), 'create index')
      for (const { pub, contents } of pages) {
        check(await index.addHTMLFile({ url: pub.url, content: contents.toString() }), `index ${pub.url}`)
      }
      const { files } = check(await index.getFiles(), 'generate assets')
      for (const { path, content } of files) {
        siteCatalog.addFile({ contents: Buffer.from(content), out: { path: `pagefind/${path}` } })
      }
      logger.info('Indexed %d documentation pages', pages.length)
    } finally {
      await pagefind.close()
    }
  })
}

function check (result, action) {
  if (result.errors.length) throw new Error(`Pagefind failed to ${action}: ${result.errors.join('; ')}`)
  return result
}
