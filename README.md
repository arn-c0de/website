# website

Project console for [github.com/arn-c0de](https://github.com/arn-c0de) — a single-page app with
tabs for an overview, projects, stack, about and secure contact. The overview is the landing tab:
an introduction, a swipeable gallery of featured repositories and a tile per section, each linking
into the tab it summarises.
Live at **https://arn-c0de.github.io/website/**. Repository data comes from the GitHub API at
runtime; a committed snapshot keeps the site working when the API is rate-limited or unreachable.

## Stack

Next.js 15 with the App Router, statically exported (`output: 'export'`) to plain files. No CSS
framework, no icon package, no analytics. Fonts are bundled from `@fontsource`, so the only
outbound request a visitor's browser makes is to `api.github.com`.

## Changing what the site shows

Everything editorial lives in **`projects.config.ts`**. Commit a change there and the deploy
workflow publishes it.

```ts
featured: ['Crawllama', 'GPG-Meister', …]   // shown first, in this exact order
hidden: ['arn-c0de']                        // never appears
showForks: false                            // forks are hidden unless true
showAllByDefault: false                     // false → rest sits behind "show all"
```

Per-repo text is overridden by name — useful when a GitHub description reads poorly or is missing:

```ts
overrides: {
  'ESP-SATDUMP': {
    title: 'SatDump',                       // replaces the repo name
    description: 'ESP32 satellite …',       // replaces the GitHub blurb
    category: 'Embedded',                   // skips category inference
    topics: ['esp32', 'sdr'],               // replaces the topic list
    links: [{ label: 'Docs', href: '…' }],  // extra buttons in the detail panel
    hidden: true,                           // same as listing it in `hidden`
    show: true,                             // keeps a fork on the page anyway
  },
}
```

`show` is the exception to the filters, not to `hidden`: it is what keeps `Project_Nova` listed
while `showForks` is false, because that repo is a fork of my own game.

Categories are inferred from topics and language via the `categories` array — first match wins,
`fallbackCategory` catches the rest. The Stack tab needs no maintenance at all: it counts
languages, domains and topics from whatever the API returns.

## Moving between tabs

The tab bar is a segmented control: every section carries its own mark, and one
tinted pill travels to whatever you press — measured from the DOM in `AppShell.tsx`, because tab
widths depend on the font. Under 640px only the tab you are on keeps its label; the others are
marks, which is also what keeps the row from overflowing on a phone. A tap on a touch device gets
a 7ms buzz through `navigator.vibrate`, and pressing the tab you are already on scrolls back to
the top.

The switch itself is a **view transition**: the outgoing pane falls back and blurs out while the
next one comes forward. The browser snapshots the page as it is painted, so the old tab is never
rendered a second time and none of its scroll-revealed pieces have to be re-shown. Three details
that are easy to break:

- Only `.pane` and the pill are named (`view-transition-name`), and only while `data-vt="tab"` is
  on the root. Everything else swaps instantly — cross-fading it would mean animating a snapshot
  of the whole scrollable page, which squashes the header when a short tab follows a long one.
- The pill is named as well, because during a transition the rest of the bar is a still image,
  and a CSS transition inside a still image does not move. It is translucent so the label
  underneath stays readable as it passes over.
- The pane keeps its CSS entrance for browsers without the API, and `apply()` in `AppShell.tsx`
  calls `.finish()` on it instead of the CSS switching it off — an animation that goes from `none`
  back to something starts over, and the pane would replay its entrance the moment the transition
  ends.

`prefers-reduced-motion` or no `startViewTransition` and the state simply changes; the CSS
entrance in `globals.css` carries it. The theme wipe uses the same API and marks itself with
`data-vt="theme"`, which is what its `::view-transition-old(root)` rules are scoped to.

## The stack tab

Four readings of the same repository list, none of them hand-written:

- a **ring** of the language split, with the bar list beside it — hovering either side highlights
  the other, and picking a language opens the projects tab filtered to it,
- an **activity chart**: how many projects sat between their first commit and their last push in
  each month (area), and how many started in it (bars),
- a **project timeline**: one lane per repository from creation to last push, coloured by
  language; a lane opens that project,
- the domain grid and the topic cloud, where a topic searches the projects tab for it.

The aggregation lives in `lib/stats.ts` and the drawing in `components/Charts.tsx` — plain inline
SVG, no charting library, no canvas. Two things to know before editing them:

- Colour comes from CSS custom properties in `globals.css`, not from the markup, so the charts
  follow the theme. Only the per-language hues are computed, by the same `languageHue()` the
  language dots use.
- Dynamic state travels on `data-*` attributes rather than in `className`. The scroll-reveal
  observer writes `is-in` straight onto the DOM node; a `className` React re-rendered on hover
  would take that class with it and the element would drop back to `opacity: 0`.

Nothing in `lib/stats.ts` reads the clock or the locale — months are bucketed in UTC with a fixed
label table — so the prerendered HTML and the first client render agree exactly.

### Refreshing the offline snapshot

`data/repos.json` is the fallback shown when the API is unavailable.
`.github/workflows/refresh-snapshot.yml` refetches it every Sunday and commits only when something
changed — that push then deploys. Run it by hand from the Actions tab, or regenerate it locally:

```bash
curl -s "https://api.github.com/users/arn-c0de/repos?per_page=100&sort=updated" \
  | jq '[.[] | {name, full_name, description, html_url, homepage, language,
                stargazers_count, forks_count, topics, fork, archived,
                pushed_at, created_at, license: .license.spdx_id}]' \
  > data/repos.json
```

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build      # static output in out/
npm run preview    # build without the sub-path and serve it at localhost root
```

### The social preview

`public/og.png` is the card a link to the site unfurls into, written by `node scripts/generate-og.mjs`
and committed. Edit the script and rerun it to change the wording; `app/layout.tsx` points at the
file by absolute URL. It is a plain file in `public/` rather than an `app/opengraph-image.tsx`
metadata route on purpose — that route exports as an *extensionless* file, which GitHub Pages
serves as `application/octet-stream`, and every unfurler refuses it.

There is no service worker and nothing is cached offline. `public/sw.js` is only a tombstone that
clears the caches of the worker this site used to register and then unregisters itself; it can go
once no visitor can still be carrying that worker.

### The base path

This is a *project* repo, so Pages serves it from `/website/` rather than a domain root.
`next.config.mjs` sets `basePath` accordingly, and `lib/basePath.ts` exposes `asset()` for the
handful of raw URL strings Next does not rewrite itself (manifest, icons, the
`.asc` download). Change it in one place when the hosting changes:

```bash
PAGES_BASE_PATH=""             # custom domain, or the arn-c0de.github.io user-site repo
PAGES_BASE_PATH="/other-name"  # a differently named project repo
```

Add a `public/CNAME` file containing the hostname if you point a custom domain here, and set
`PAGES_BASE_PATH=""` in the workflow at the same time.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`: typecheck → build → publish `out/` to
GitHub Pages. The workflow explicitly builds with `PAGES_BASE_PATH=/website`, so generated assets,
the manifest and the service-worker scope all point to `https://arn-c0de.github.io/website/`.

**Settings → Pages → Source must stay on "GitHub Actions".** If it is ever switched to "Deploy
from a branch", GitHub's legacy Jekyll builder takes over, publishes the repository root instead
of the exported `out/` directory, and the site turns into a rendered copy of this README. That is
the failure mode to recognise: a page titled `website` showing this text. Fixing it means
setting the source back to GitHub Actions and re-running the workflow — the API equivalent is:

```bash
gh api -X DELETE repos/arn-c0de/website/pages
gh api -X POST   repos/arn-c0de/website/pages -f build_type=workflow
gh workflow run deploy.yml --ref main
```

The repository must be public for Pages to publish on a free account.

## The project panel

Opening a project slides a panel over whatever you were looking at, so the grid, the gallery and
the timeline all keep their place. Inside it: `[` and `]` — or the two chevrons in its header —
step to the previous and next repository without going back to the list first, and *Copy link*
hands over the current URL, which already carries `?p=<Name>`.

Stepping follows the order the site holds the repositories in (the API's `sort=updated`), not the
order of whichever filtered view you came from; the buttons disable at the ends.

## The request modal

Visitors pick what their message is about — a request type, one or more topic areas, any projects
they added via *Ask about this* in a project panel — and get a finished email they only have to
send. It opens from the *Request* button in the top bar, from a project panel, or from the command
palette, and shows the live draft next to the form.

Areas and projects are both picked through `components/SearchPicker.tsx` — one search box over a
scrollable multi-select list, with chosen entries pinned to the top so a search can never hide a
selection. Projects match on name, description, language, category and topics, so "esp32" or
"rag" finds them without knowing the repository name. There is no backend: the draft is built in the browser and handed to their own mail client
through a `mailto:` link, with *Copy draft* as the fallback when no client is configured.

The wording is deliberately neutral. There is no budget field, no rates and no "commissioned work"
framing, because no business is registered — every kind of inquiry is possible, none of it is
advertised as a paid service. Keep that in mind when editing the copy.

Everything configurable lives in `lib/request.ts`:

```ts
INQUIRY_EMAIL   // where requests go — kept separate from the secure-contact address
INQUIRY_TYPES   // the request-type chips
SERVICE_AREAS   // the searchable topic list (title + keywords the search matches on)
TIMELINES       // timeframe options
MAILTO_LIMIT    // above this the UI steers people to Copy draft instead
```

`buildBody()` in the same file is the email template. Request state lives in the URL
(`?request=1&for=Crawllama,GPG-Meister`), so a prepared request is a shareable link. The older
`?tab=request` form of that link still opens the modal.

## Contact and keys

`public/arn-c0de.asc` is the PGP public key rendered on the contact tab. Its fingerprint is
`93A7 8377 0EEA FFA4 3B24  22F1 A0F9 A2E7 0D64 2ADC`. If the key is ever rotated, replace that
file and update the matching constants in `components/ContactPane.tsx` and `lib/pgpKey.ts`.

## Privacy

No cookies, no tracking, no analytics, no external fonts. The only automatic outbound request is
to `api.github.com`; opening a project additionally fetches that repository's readme.

Readme HTML is passed through a sanitising step in `components/ProjectPanel.tsx` that strips
scripts, event handlers and `javascript:` URLs, rewrites relative paths to `raw.githubusercontent`,
and **parks every image URL in `data-src`** so badges and screenshots hosted by GitHub are only
requested after the visitor presses *Load images*. The expandable privacy note in the footer
states all of this to the visitor.
