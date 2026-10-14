/**
 * What is being worked on right now — the overview's "Currently building"
 * card and the About tab's "Current projects" list both read from here, so
 * a change is made once. QLink stays the headline of the overview card; the
 * items below are what the card lists under it.
 *
 * The site claims this is current, so `reviewed` says when that was last
 * true. The content audit (`npm run content:audit`) warns once it is older
 * than 60 days: check the list, change what is no longer right, and set
 * `reviewed` to today even when nothing changed.
 */
import type { Localized } from './timeline.config'

export interface NowItem {
  name: Localized
  /** Site path of the project's own page, e.g. '/deepvision/'. */
  href?: string
  /** One line for the About list; without it the item is only on the overview card. */
  about?: Localized
  /** Which row of the overview card lists it; leave out to keep it off the card. */
  overview?: 'web' | 'also'
}

export const now: { reviewed: string; items: NowItem[] } = {
  reviewed: '2026-10-13',
  items: [
    {
      name: 'Trace',
      about: { en: 'for industrial environments', de: 'für industrielle Umgebungen' },
      overview: 'web',
    },
    {
      name: 'JobFinder',
      about: {
        en: 'self-hosted web app for jobs, freelance projects and public tenders',
        de: 'selbst gehostete Web-App für Jobs, Freelance-Projekte und Ausschreibungen',
      },
      overview: 'web',
    },
    {
      name: 'ARIS',
      about: {
        en: 'self-hosted AI agent with voice output and tool support',
        de: 'selbst gehosteter KI-Agent mit Sprachausgabe und Werkzeugen',
      },
      overview: 'also',
    },
    {
      name: 'DeepVision-Web',
      href: '/deepvision/',
      about: {
        en: 'PCB inspection in the browser, camera frames stay on the device',
        de: 'Leiterplatten-Prüfung im Browser, Kamerabilder bleiben auf dem Gerät',
      },
      overview: 'web',
    },
    {
      name: 'Agent Office',
      href: '/agent-office/',
      about: {
        en: 'office for a small team of AI coding agents, test versions on request',
        de: 'Büro für ein kleines Team von KI-Coding-Agenten, Testversionen auf Anfrage',
      },
      overview: 'also',
    },
    {
      name: 'QLink',
      about: {
        en: 'Rust game and simulation engine for Linux and Quest 3',
        de: 'Spiel- und Simulations-Engine in Rust für Linux und Quest 3',
      },
    },
    { name: 'FLUID', overview: 'also' },
  ],
}

export default now
