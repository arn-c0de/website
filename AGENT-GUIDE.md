# Agent guide

How to find your way around this site and change it quickly, for a person or an agent. Start with
the table, follow the recipe, run the checks, push to `main`. [CONTENT.md](CONTENT.md) covers
*what* to keep current; this file covers *where* things live and *how* to add more of them.

The site is a Next.js static export (`output: 'export'`) deployed to GitHub Pages at
https://arn-c0de.de. A push to `main` runs `.github/workflows/deploy.yml`: typecheck, tests,
content audit, fetch videos/readmes/releases/activity, build, smoke test, publish. There is no
server and no database; everything the site says is in the repository.

## I want to … → edit this

| I want to … | File | Time |
| --- | --- | --- |
| Post news, a milestone or a video | `timeline.config.ts` → `timeline` array | 2 min |
| Move a plan to "in progress" or "done" | `timeline.config.ts` → the entry's `status` and `date` | 1 min |
| Change "Currently building" / About "Current projects" | `now.config.ts` (set `reviewed` to today) | 2 min |
| Change a public repo's title, text, category, order | `projects.config.ts` (`featured`, `overrides`) | 2 min |
| Fill a project page with roadmap, milestones, features, changelog | in **that repo**: add `ROADMAP.md`, `MILESTONES.md`, `FEATURES.md`, `CHANGELOG.md` | 0 min here |
| Show a different or extra markdown file on a project page | `projects.config.ts` → `overrides['<repo>'].docs` | 1 min |
| Add or change a private project | `lib/privateProjects.ts` (+ `featured` in `projects.config.ts`) | 5 min |
| Hide, retitle or mark 18+ a channel video | `timeline.config.ts` → `youtube` | 1 min |
| Change a long text (intro, About, QLink, DeepVision) | `lib/i18n-de.ts` → `LONG` (en + de side by side) | 2 min |
| Translate a UI label | `lib/i18n-de.ts` → `DE` (key = the English text) | 1 min |
| Give a repo an icon | `images/repo_icons/<repo>.png` → `node scripts/generate-repo-icons.mjs` | 3 min |
| Give a private project an icon (light + dark) | `public/projects/<name>/` + `icon`/`iconDark` in `lib/privateProjects.ts` | 5 min |
| Add a page of its own (like `/qlink/`, `/deepvision/`) | see [New page](#a-new-page-of-its-own) | 20 min |
| Redraw the site and project link-preview cards (commit them) | `node --import ./scripts/test-setup.mjs scripts/generate-og.mjs` | 3 min |
| Link-preview cards of timeline posts | nothing: the deploy draws them (`generate-og.mjs --posts`) | 0 min |
| Change contact channels, socials | `lib/socials.ts`, `components/ContactPane.tsx` | 5 min |

## Where the code lives

```
app/                     routes; English at the root, German under app/de/ (same files, locale 'de')
  page.tsx               overview with the tabs (?tab=projects|timeline|stack|about|contact)
  projects/[slug]/       one page per public repo
  timeline/[id]/         one page per timeline entry
  qlink/, deepvision/    pages of their own
  sitemap.ts             every page in both languages, with hreflang alternates
lib/routes/*.tsx         metadata + page builders shared by the en and de route files
components/              UI; *Pane.tsx are the tabs, *Page.tsx the standalone pages
lib/i18n.tsx, i18n-de.ts translation: t('English text'), LONG keys for paragraphs
lib/localePath.ts        '/x/' → '/de/x/' and back; useI18n().href() makes locale-aware links
lib/timeline.ts          sorting, dates, visuals, 18+ handling of timeline entries
lib/github.ts            repos from the API with data/repos.json as the offline snapshot
data/                    snapshots the build reads (repos, videos, readmes, releases, activity)
public/                  served as is: timeline/, repo-icons/, projects/, og/
scripts/                 fetchers, generators, smoke test, content audit
test/                    node:test suites (npm test)
```

## Recipes

### A timeline post (news, milestone, release)

Add an object to the `timeline` array in `timeline.config.ts`. Order in the file does not matter;
the tab sorts by status, then date.

```ts
{
  id: 'gpg-meister-1-2',              // lowercase-dashes, never changes: it is the URL /timeline/<id>/
  status: 'done',                     // 'planned' | 'now' | 'done'
  date: '2026-10-12',                 // 'YYYY-MM', 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM' (UTC) for same-day order
  title: { en: 'GPG-Meister 1.2: key expiry warnings', de: 'GPG-Meister 1.2: Warnung vor ablaufenden Schlüsseln' },
  text: { en: 'Two or three sentences.', de: 'Zwei oder drei Sätze.' },
  body: { en: 'Optional longer write-up for the post page.\n\nParagraphs split by a blank line.', de: '…' },
  layout: 'text',                     // or 'image-left' | 'image-right' | 'images-sides' | 'image-center' | 'gallery'
  media: [{ src: '/timeline/gpg-meister-1-2.webp', alt: { en: '…', de: '…' } }],
  tags: ['gpg', 'security'],
  project: 'GPG-Meister',             // exact repo name or a private project's name → "Open project"
}
```

- Pictures: `public/timeline/<id>.webp`, around 1200 px wide.
- Every visible text in English **and** German.
- Every entry gets its own page, a feed item and a sitemap entry automatically.

### A video

- **Uploaded to the channel:** nothing to do. The deploy reads the channel feed and adds it with a
  thumbnail. Retitle or re-text it with `youtube.overrides['<video id>']`, drop it with
  `youtube.hidden`.
- **Want it with a custom text right away:** a timeline entry with
  `media: [{ youtube: 'https://youtu.be/<id>', title: { en: '…', de: '…' } }]` and an `id` of
  your own. The auto-import then leaves that video alone.
- **18+ on YouTube:** add the id to `youtube.ageRestricted.ids` (or a title word to
  `titleIncludes`). The preview is blurred and the player links out with the `note`.

### Plan → in progress → done

Change `status` and set `date` to when it actually happened. For a plan that slipped, move its
date. `npm run content:audit` lists overdue plans and stale `now` entries.

### A private project

1. `lib/privateProjects.ts`: add a `privateProject('<Name>-private', '<Title>', '<one line, say it is private>', [topics], { language, page, icon, iconDark })`.
2. `projects.config.ts`: put `'<Name>-private'` into `featured` where it should appear (the
   dashboard shows the first 12 in that order).
3. Optional `now.config.ts` item and timeline entries with `project: '<Name>-private'`.
4. Publish nothing internal: no customer or product names, IPs, hostnames, file paths or data.

### A new page of its own

Model it on `/deepvision/` (static content) or `/qlink/` (built from the timeline):

1. `components/<Name>Page.tsx`: `'use client'`, wraps `<Content />` in
   `<I18nProvider locale={locale}>` and `<PageChrome back={…}>`. Texts through `t(…)`, links
   through `href('/path/')`.
2. `lib/routes/<name>.tsx`: `<name>Metadata(locale)` with `alternates: pageAlternates('/<name>/', locale)`
   and the route component.
3. `app/<name>/page.tsx` and `app/de/<name>/page.tsx`, three lines each (copy from `app/deepvision/`).
4. `app/sitemap.ts`: add `{ path: '/<name>/', … }`.
5. Strings: short ones into `DE`, paragraphs as `LONG` keys with `en` and `de`.
6. Styles at the end of `app/globals.css` under a `/* ── <Name> page ── */` heading, built from
   the existing tokens (`--text`, `--border`, `--accent`, …) so both themes work.
7. Link to it from where visitors look: `now.config.ts` (`href`), a private project's `page`, or a
   timeline entry's `links`.

### Project pages from the repo's own files

A project page (`/projects/<slug>/`) is filled from the repository itself at every deploy:

- **Readme** → the main text.
- **Roadmap, milestones, features, changelog** → sections under the readme. `scripts/fetch-readmes.mjs`
  looks through the repo's file tree for markdown files named `ROADMAP`, `MILESTONES`/`MILESTONE`,
  `FEATURES`, `CHANGELOG`/`CHANGES`/`HISTORY` (any case, `.md`), takes the one nearest the root
  of each kind (`ROADMAP.md` before `docs/ROADMAP.md`), lets GitHub render it and stores it in
  `data/docs/<repo>.json`. Roadmap and milestones show open, features and changelog folded;
  files over 40 KB are cut at a heading with a link to the full file.
- **Releases** → the latest release with its downloads (`scripts/fetch-releases.mjs`).
- **Timeline** → every entry with `project: '<repo>'`.

So the fastest way to update a project page is to update the repo: a new milestone in its
`ROADMAP.md` is on the site after the next deploy. To steer it per repo:

```ts
overrides: {
  'GPG-Meister': { docs: ['docs/plan-vs-code.md'] },  // add or replace files (path in the repo)
  'Alpaca': { docs: false },                          // show none
}
```

Logic and tests: `lib/repoDocs.ts`, `test/repo-docs.test.ts`. Nothing of this is committed
(`data/docs/` is ignored), so locally the sections only appear after running the fetch script with
a `GITHUB_TOKEN`.

### A UI label or text

Write the English text in the component: `t('Show all')`. Add `'Show all': 'Alle zeigen'` to `DE`.
For a paragraph use a short UPPER key: `t('ABOUT_NOTE')` and an entry in `LONG`. The tests fail on
any `t('…')` without a German entry.

## Checks

| Command | What it proves | Time |
| --- | --- | --- |
| `npm run typecheck` | types | 20 s |
| `npm test` | logic, translations, dates, content audit errors | 10 s |
| `npm run content:audit` | what is stale or missing (report, not a gate) | 5 s |
| `PAGES_BASE_PATH="" npm run build` | the static export builds | 1–2 min |
| `CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/smoke.mjs` | every page on desktop and phone: no script errors, no 404s, nothing cut off, no axe a11y violations, no broken internal links, first load within `BUDGET` (script, CSS, fonts, images, HTML) | 5–10 min |

For a text-only change (timeline, now, projects config) typecheck + test is enough; the deploy
runs the rest and does not publish when it fails. For a change to components, routes or CSS, run
the build and the smoke test before pushing.

## Performance rules

- The overview is the only tab in the first load. Other tabs, the project panel and the request
  dialog are `next/dynamic` chunks in `components/AppShell.tsx`, preloaded when the page is idle.
  A component the overview needs must not import from a tab's file (that is why `HelpWanted`
  has its own file).
- The Latin subsets of Manrope and Fraunces come through `next/font` (`lib/fonts.ts`) and are
  preloaded; the other subsets stay with @fontsource and load only when used.
- Images: WebP, `loading="lazy"` for anything in lists or below the fold.
- `scripts/smoke.mjs` fails a page whose first load exceeds `BUDGET`. Raise a budget only on
  purpose, with the reason in the commit message.

## Rules

- Commits are authored and committed as `arn-c0de <arn-c0de@protonmail.com>`. No co-author or
  session lines naming an AI assistant, and no branch names containing "claude".
- `main` is what is live. Push there when the checks pass.
- Ids and paths are URLs: never rename a timeline `id` or a page path once it is published.
- Never invent dates, numbers or progress. Ask the owner when the facts are not in the repos.
- Private projects stay vague on purpose: what it does, the focus, the status, nothing internal.
