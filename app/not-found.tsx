import type { Metadata } from 'next'
import { asset } from '@/lib/basePath'

/**
 * GitHub Pages serves this for every path under the site that is not a file,
 * so it is the page a stale or mistyped link lands on. Next ships a bare
 * default otherwise: black on white, no styling, and no way back.
 *
 * Deliberately static markup — no AppShell, no repository data, nothing to
 * fetch. The tab links are the same query strings the app itself uses.
 */
export const metadata: Metadata = {
  title: 'Not found — arn-c0de',
  robots: { index: false, follow: true },
}

const WAYS_IN = [
  { href: '?tab=projects', label: 'Projects' },
  { href: '?tab=stack', label: 'Stack' },
  { href: '?tab=about', label: 'About' },
  { href: '?tab=contact', label: 'Contact' },
]

export default function NotFound() {
  const home = asset('/')

  return (
    <main className="main">
      <div className="pane">
        <div className="pane__head">
          <p className="tag">404</p>
          <h1 className="pane__title">Nothing at this address</h1>
          <p className="pane__lede">
            The link is either out of date or was never a page here. Everything on this site lives
            behind one address, so the way back is short.
          </p>
        </div>

        <div className="hero__actions">
          <a className="btn btn--request" href={home}>
            Back to the overview
          </a>
          {WAYS_IN.map((way) => (
            <a key={way.href} className="btn" href={`${home}${way.href}`}>
              {way.label}
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
