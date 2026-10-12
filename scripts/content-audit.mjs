/**
 * Lists what on the site is missing, broken or out of date — see CONTENT.md.
 *
 *   npm run content:audit             Markdown report
 *   npm run content:audit -- --json   the same findings as JSON, for agents
 *   npm run content:audit -- --strict exit 1 when there are errors
 *
 * Reads only committed files: data/repos.json is the snapshot the weekly
 * refresh keeps current, so "pushed after the newest timeline entry" is as
 * fresh as that snapshot.
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../projects.config.ts'
import timeline from '../timeline.config.ts'
import { now as nowList } from '../now.config.ts'
import repos from '../data/repos.json'
import icons from '../data/repo-icons.json'
import { PRIVATE_PROJECTS } from '../lib/privateProjects.ts'
import { auditContent, formatAudit } from '../lib/contentAudit.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const now = new Date()

const findings = auditContent({
  repos,
  config,
  privateNames: PRIVATE_PROJECTS.map((p) => p.name),
  timeline,
  icons,
  nowReviewed: nowList.reviewed,
  publicFileExists: (path) => existsSync(join(root, 'public', path)),
  now,
})

process.stdout.write(args.has('--json') ? JSON.stringify(findings, null, 2) + '\n' : formatAudit(findings, now))
if (args.has('--strict') && findings.some((f) => f.level === 'error')) process.exitCode = 1
