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

// Publishes release tags of this repository (OpenAM-15.2.2 etc.) as older versions of a component.
//
// A content source that names a tag is not read by Antora from the git tree, for two reasons:
// - the antora.yml of every tag declares `version: ~`, and Antora gives the version in antora.yml
//   precedence over the version of the content source, so the tag would be merged into the
//   unversioned component version built from the branch;
// - Antora reads every file under the start path of a git tree, and the start path of a tag also
//   holds the API docs of that time (18,672 files for OpenAM-15.2.2, against 330 pages), which
//   makes the build several times slower.
// Instead, only antora.yml and modules/ of the tag are extracted with `git archive` into a
// temporary repository, which is aggregated apart from the other sources, and the result is given
// the version of the tag: OpenAM-15.2.2 becomes version 15.2, displayed as 15.2.2. The branch
// stays the unversioned (and latest) version, so its URLs do not change.
// The temporary repositories are kept at a fixed path, build/antora-tags/<tag>, because Antora logs
// the files of a tag with that path, and .github/build-baseline keys the known errors by it.

const { execFileSync } = require('child_process')
const fs = require('fs')
const ospath = require('path')

const TAG_RX = /^[^-]+-(\d+)\.(\d+)\.(\d+)$/

module.exports.register = function () {
  const logger = this.getLogger('versions-from-tags')
  this.replaceFunctions({
    async aggregateContent (playbook) {
      const aggregateContent = this.require('@antora/content-aggregator')
      const sources = playbook.content.sources
      const withSources = (subset) => ({ ...playbook, content: { ...playbook.content, sources: subset } })
      const aggregate = await aggregateContent(withSources(sources.filter((source) => !source.tags)))
      const tmpdir = ospath.join(playbook.dir, 'build', 'antora-tags')
      fs.rmSync(tmpdir, { recursive: true, force: true })
      fs.mkdirSync(tmpdir, { recursive: true })
      try {
        for (const source of sources.filter((source) => source.tags)) {
          const tag = source.tags
          const match = typeof tag === 'string' && tag.match(TAG_RX)
          if (!match) throw new Error(`content source ${source.startPath}: tags must name one release tag, got ${tag}`)
          const worktree = ospath.join(tmpdir, tag)
          extractTag(ospath.resolve(playbook.dir, source.url), tag, source.startPath, worktree, logger)
          const tagSource = { url: worktree, branches: 'HEAD', startPath: source.startPath, editUrl: source.editUrl }
          for (const componentVersion of await aggregateContent(withSources([tagSource]))) {
            componentVersion.version = `${match[1]}.${match[2]}`
            componentVersion.displayVersion = `${match[1]}.${match[2]}.${match[3]}`
            logger.info('%s %s from tag %s', componentVersion.name, componentVersion.version, tag)
            aggregate.push(componentVersion)
          }
        }
      } finally {
        fs.rmSync(tmpdir, { recursive: true, force: true })
      }
      return aggregate
    },
  })
}

// Extracts antora.yml and modules/ of startPath at tag into a new single-commit repository.
// Fetches the tag from origin first if the repository does not have it, as in a CI checkout.
function extractTag (repo, tag, startPath, worktree, logger) {
  const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: 'pipe' })
  try {
    git(repo, 'rev-parse', '-q', '--verify', `refs/tags/${tag}^{commit}`)
  } catch {
    logger.info('fetching tag %s', tag)
    const shallow = git(repo, 'rev-parse', '--is-shallow-repository').trim() === 'true'
    try {
      git(repo, 'fetch', '-q', '--no-tags', ...(shallow ? ['--depth=1'] : []), 'origin', `+refs/tags/${tag}:refs/tags/${tag}`)
    } catch (err) {
      // e.g. a clone of a fork created before the tag was pushed, or no network
      throw new Error(`cannot fetch tag ${tag} from the origin of ${repo}; if the tag is missing there, run ` +
        `git fetch https://github.com/OpenIdentityPlatform/doc.openidentityplatform.org tag ${tag}\n${err.stderr || err.message}`)
    }
  }
  fs.mkdirSync(worktree)
  const paths = [`${startPath}/antora.yml`, `${startPath}/modules`]
  const archive = execFileSync('git', ['-C', repo, 'archive', '--format=tar', tag, '--', ...paths], {
    maxBuffer: 1024 * 1024 * 1024,
  })
  // -f -: without it tar reads the archive from $TAPE or a system-dependent default device
  execFileSync('tar', ['-x', '-f', '-', '-C', worktree], { input: archive })
  // the branch is named after the tag, so that Antora logs the tag as the refname of its files
  git(worktree, 'init', '-q', '-b', tag)
  git(worktree, 'add', '-A')
  // no hooks: a global core.hooksPath or init.templateDir hook of the developer may reject the commit
  git(worktree, '-c', 'user.name=antora', '-c', 'user.email=antora@localhost', '-c', 'commit.gpgsign=false',
    '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', tag)
}
