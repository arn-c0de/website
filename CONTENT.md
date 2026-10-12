# Keeping the content current

A playbook for whoever updates the site, person or agent. For where things live in the code and
how to add new kinds of content, see [AGENT-GUIDE.md](AGENT-GUIDE.md). The site's code rarely needs touching to
keep it current; what goes stale is what it *says*. All of that lives in four files:

| File | What it holds |
| --- | --- |
| `timeline.config.ts` | Timeline posts: planned, in progress, done. The overview's "latest" strip reads from it. |
| `now.config.ts` | "Currently building" on the overview and "Current projects" under About. |
| `projects.config.ts` | Order, titles, descriptions, categories and links of the public repositories. |
| `lib/privateProjects.ts` | The private projects (JobFinder, DeepVision-Web, anon-WebMirror). |

Longer fixed passages, such as the introduction, the About text and the QLink and DeepVision pages,
are in `lib/i18n-de.ts` (`LONG`, English and German side by side). They change rarely; read them
again when a project's direction changes.

## The routine

```bash
npm run content:audit             # what is missing, broken or out of date
npm run content:audit -- --json   # the same as JSON
```

1. Run the audit. Work from the top: errors first, then *Out of date*, then *Gaps* as time allows.
2. For anything that needs facts (what changed in a repo, dates, screenshots), read the repo's
   recent commits, releases and readme on GitHub. Never invent progress, dates or numbers. When the
   facts are not there, ask the owner.
3. Write every visible text in English **and** German (`{ en: '…', de: '…' }`).
4. `npm run typecheck && npm test`. The tests fail on audit errors, missing translations and
   malformed dates, so a green run means the content is at least consistent.
5. Commit with a message that says what the site now says, e.g. "Timeline: GPG-Meister 1.2 with
   key expiry warnings". The deploy publishes it.

The deploy writes the same report into the job summary of every run, so the current state is also
visible under Actions without running anything.

## Each finding and its fix

### Errors: the site points at nothing

- **`unknown-featured`**: `featured` in `projects.config.ts` names a repo that does not exist.
  Fix the spelling or remove it.
- **`unknown-project`**: a timeline entry's `project` or `mentions` names an unknown repo. Use the
  exact repository name, or a name from `lib/privateProjects.ts`.
- **`missing-media`**: a picture, video or poster path that is not in `public/`. Add the file or
  fix the path.
- **`bad-reviewed`**: a `reviewed` date that is not `YYYY-MM-DD`.

### Out of date: probably no longer true

- **`activity-not-posted`**: the repo was pushed more than 30 days after its newest timeline entry.
  Look at what changed since then:
  - Something a visitor would care about (a feature, a release, a new device, a demo) → add a
    `done` entry with `project: '<repo>'` and the date of the change.
  - Only maintenance (dependencies, typos, CI) → set `reviewed: '<today>'` on the repo's override
    in `projects.config.ts`. That means "checked, nothing to post", and the audit stays quiet until
    the next push.
- **`planned-overdue`**: a planned entry whose month or day has passed. If it shipped, set
  `status: 'done'` and the real date. If work is under way, set `'now'`. If it slipped, move the
  date, and update `plannedNote` when a whole plan moved.
- **`now-stale`**: an entry marked `now` for more than 45 days. Mark it `done`, or add a newer entry
  about what has happened since and keep that one as `now`.
- **`done-in-future`**: a `done` entry dated in the future. Usually a typo in the year or month.
- **`now-list-stale`**: `now.config.ts` was last checked more than 60 days ago. Check every item
  against what is really being worked on: remove finished or paused ones, add new ones, and set
  `reviewed` to today even when nothing changed.
- **`unknown-override`**: an override for a repo that is gone or was renamed. Rename the key or
  delete the override.
- **`thin-description`** / **`no-topics`**: the card would read as a placeholder or land in the
  fallback category. Prefer fixing the description and topics on GitHub itself. An override in
  `projects.config.ts` works too and wins over GitHub.

### Gaps: worth filling

- **`no-timeline`**: a public repo the timeline never mentions. One `done` entry when it was first
  published is enough: the date of its first release or its creation date, two sentences on what
  it does, `project: '<repo>'`. When one entry covers several repos, put the others in `mentions`.
- **`no-icon`**: put a square PNG of at least 256 px in `images/repo_icons/` and run
  `node scripts/generate-repo-icons.mjs`. That writes `public/repo-icons/` and
  `data/repo-icons.json`.

## What the audit cannot see

- **Private projects** have no push dates the site can read. Their news comes from the owner, and
  `now.config.ts` (with its `reviewed` date) is where their status is kept honest.
- **YouTube videos** join the timeline on their own at every deploy. Only `youtube.overrides` and
  `hidden` in `timeline.config.ts` need care.
- **Freshness is as fresh as `data/repos.json`.** The weekly *Refresh repo snapshot* workflow keeps
  it current. Run it by hand under Actions before an audit that has to be exact today.

## Conventions

- Dates: `YYYY-MM`, `YYYY-MM-DD`, or `YYYY-MM-DDTHH:MM` (UTC) to order several entries of one day.
  A timeline post is dated when the thing happened, not when it was written down.
- Timeline ids are lowercase with dashes and never change, because they are URLs (`/timeline/<id>/`).
- Pictures go in `public/timeline/`, as WebP around 1200 px wide.
- Commits are authored as `arn-c0de <arn-c0de@protonmail.com>`.
