/**
 * The timeline tab: what is planned, what is being worked on, what is done.
 * Edit this file and push — the deploy publishes it. Newest first is not
 * required; the tab sorts by status (planned → now → done) and then by date.
 *
 * Images go in `public/timeline/` and are referenced as `/timeline/name.webp`.
 * WebP or JPEG around 1200px wide keeps the page light.
 *
 * Every text field takes either a plain string (shown in both languages) or
 * `{ en: '…', de: '…' }`.
 *
 * Layouts — how an entry places its pictures and text:
 *
 *   'text'          text only
 *   'image-left'    picture left, text right
 *   'image-right'   text left, picture right
 *   'images-sides'  picture left, text in the middle, picture right (2 images)
 *   'image-center'  text left, picture in the middle, `aside` text right
 *   'gallery'       text on top, a row of pictures below (2–4 images)
 *
 * On a phone every layout stacks: picture(s) first, then the text.
 *
 * Videos sit in `media` next to pictures and take the same places in every
 * layout. Two kinds:
 *
 *   { youtube: 'https://youtu.be/…', title: … }
 *       Any YouTube link (or the bare id). Nothing is loaded from YouTube
 *       until the visitor presses play; then it runs in the privacy-enhanced
 *       youtube-nocookie.com player, with a link to watch it on YouTube.
 *       Give it a `poster` from public/ to show a still before playing.
 *
 *   { video: '/timeline/clip.mp4', title: …, poster: '/timeline/clip.webp' }
 *       A file served from this site (MP4 or WebM), with player controls.
 *       `loop: true` turns a short clip into a silent, looping preview.
 */

export type Localized = string | { en: string; de: string }

export type TimelineStatus = 'planned' | 'now' | 'done'

export type TimelineLayout =
  | 'text'
  | 'image-left'
  | 'image-right'
  | 'images-sides'
  | 'image-center'
  | 'gallery'

export interface TimelineImage {
  /** Path under public/, e.g. '/timeline/zombieescape.webp'. */
  src: string
  alt: Localized
  caption?: Localized
  /** 'cover' fills the frame (screenshots); 'contain' shows all of it (logos, artwork). */
  fit?: 'cover' | 'contain'
}

export interface TimelineYouTube {
  /** A YouTube link of any kind, or the 11-character video id. */
  youtube: string
  title: Localized
  /** Still shown before playing, from public/. Without it a neutral frame is shown. */
  poster?: string
  caption?: Localized
}

export interface TimelineVideoFile {
  /** Path under public/, e.g. '/timeline/qlink-demo.mp4'. */
  video: string
  title: Localized
  poster?: string
  caption?: Localized
  /** Silent looping preview instead of a player with sound and controls. */
  loop?: boolean
}

export type TimelineMedia = TimelineImage | TimelineYouTube | TimelineVideoFile

export interface TimelineEntry {
  /** Unique, stable — used as the anchor in the URL. */
  id: string
  status: TimelineStatus
  /** 'YYYY-MM' or 'YYYY-MM-DD'. Planned entries may leave it out. */
  date?: string
  /** Shown instead of the formatted date, e.g. { en: 'Early 2027', de: 'Anfang 2027' }. */
  when?: Localized
  title: Localized
  text: Localized
  /** Second text column, only used by the 'image-center' layout. */
  aside?: Localized
  layout?: TimelineLayout
  /** Pictures and videos, in the order the layout places them. */
  media?: TimelineMedia[]
  /** Older name for `media` — pictures only; still read. */
  images?: TimelineImage[]
  tags?: string[]
  /** Repository name — adds an "Open project" button that opens its panel. */
  project?: string
  links?: { label: Localized; href: string }[]
}

/**
 * Videos from the YouTube channel join the timeline on their own. The deploy
 * workflow reads the channel's public feed (no API key), keeps a short
 * summary of each description and copies the thumbnails to this site, so a
 * visitor still loads nothing from YouTube until they press play.
 *
 * The feed holds the latest 15 uploads. Use `overrides` to change what an
 * entry says or where it sits, and `hidden` to leave a video out; both are
 * keyed by the video id (the part after watch?v= or youtu.be/).
 */
export interface YouTubeSettings {
  /** The channel's @handle. */
  handle: string
  /** UC… id; found from the handle when left empty. */
  channelId?: string
  /** At most this many videos are shown. */
  max: number
  /** Shorts are left out unless this is true. */
  includeShorts: boolean
  hidden: string[]
  overrides: Record<
    string,
    {
      title?: Localized
      text?: Localized
      status?: TimelineStatus
      /** Repository name; otherwise guessed from the title and description. */
      project?: string
      tags?: string[]
    }
  >
}

export const youtube: YouTubeSettings = {
  handle: '@git-arn-c0de',
  max: 12,
  includeShorts: true,
  hidden: [],
  overrides: {},
}

const timeline: TimelineEntry[] = [
  // ── Planned ────────────────────────────────────────────────────────────
  {
    id: 'qlink-launcher',
    status: 'planned',
    when: { en: 'Next', de: 'Als Nächstes' },
    title: { en: 'QLink replaces the Link app', de: 'QLink ersetzt die Link-App' },
    text: {
      en: 'Steam and other VR games should start directly from the QLink home on Quest 3, so the Quest Link PC app is no longer needed.',
      de: 'Steam und andere VR-Spiele sollen direkt aus der QLink-Umgebung auf der Quest 3 starten, damit die Quest-Link-PC-App nicht mehr nötig ist.',
    },
    layout: 'text',
    tags: ['rust', 'pcvr', 'meta-quest-3'],
    project: 'QLink-preview',
  },

  // ── In progress ────────────────────────────────────────────────────────
  {
    id: 'qlink',
    status: 'now',
    date: '2026-10',
    title: 'QLink',
    text: {
      en: 'A Rust game and simulation engine for Linux. The simulation is the Link home on Quest 3 over USB, and the same world runs in 2D on the desktop. Very early preview; test builds on request.',
      de: 'Eine Spiel- und Simulations-Engine in Rust für Linux. Die Simulation ist die Link-Umgebung auf der Quest 3 per USB, dieselbe Welt läuft in 2D am Desktop. Sehr frühe Vorschau; Test-Builds auf Anfrage.',
    },
    layout: 'text',
    tags: ['rust', 'vulkan', 'linux', 'virtual-reality'],
    project: 'QLink-preview',
    // With a video: switch the layout and paste the link, e.g.
    //   layout: 'image-right',
    //   media: [{ youtube: 'https://youtu.be/VIDEO_ID', title: { en: 'QLink on Quest 3', de: 'QLink auf der Quest 3' } }],
  },
  {
    id: 'local-ai',
    status: 'now',
    date: '2026-10',
    title: { en: 'Local AI: ARIS, FLUID, DeepVision-Web', de: 'Lokale KI: ARIS, FLUID, DeepVision-Web' },
    text: {
      en: 'ARIS is a self-hosted AI agent with voice output and tool support. DeepVision-Web inspects PCBs in the browser; camera frames stay on the device.',
      de: 'ARIS ist ein selbst gehosteter KI-Agent mit Sprachausgabe und Werkzeugen. DeepVision-Web prüft Leiterplatten im Browser; Kamerabilder bleiben auf dem Gerät.',
    },
    layout: 'text',
    tags: ['llm', 'agents', 'webassembly'],
  },

  // ── Done ───────────────────────────────────────────────────────────────
  {
    id: 'website-redesign',
    status: 'done',
    date: '2026-10-11',
    title: { en: 'Website redesign', de: 'Website-Redesign' },
    text: {
      en: 'New layout, one colour system for light and dark, a full German translation and this timeline.',
      de: 'Neues Layout, ein Farbsystem für hell und dunkel, eine vollständige deutsche Übersetzung und dieser Zeitstrahl.',
    },
    layout: 'gallery',
    media: [
      {
        video: '/timeline/website-walkthrough.webm',
        title: { en: 'A walk through the new site', de: 'Ein Rundgang durch die neue Seite' },
        caption: { en: 'Overview, timeline and stack', de: 'Übersicht, Zeitstrahl und Stack' },
        poster: '/timeline/website-overview.webp',
      },
      {
        src: '/timeline/website-overview.webp',
        alt: { en: 'The new overview page', de: 'Die neue Übersichtsseite' },
        caption: { en: 'Overview', de: 'Übersicht' },
        fit: 'cover',
      },
      {
        src: '/timeline/website-stack.webp',
        alt: { en: 'Activity chart and project timeline', de: 'Aktivitätsdiagramm und Projektzeitleiste' },
        caption: { en: 'Stack tab', de: 'Stack-Tab' },
        fit: 'cover',
      },
    ],
    tags: ['nextjs', 'react', 'typescript'],
    project: 'website',
  },
  {
    id: 'zombieescape',
    status: 'done',
    date: '2026-07-18',
    title: { en: 'ZombieEscape preview', de: 'ZombieEscape-Vorschau' },
    text: {
      en: 'An open-world, location-based zombie survival game for Android. The preview repository shows the development, screenshots and how to request a test build.',
      de: 'Ein ortsbasiertes Open-World-Zombie-Survival-Spiel für Android. Das Vorschau-Repository zeigt die Entwicklung, Screenshots und wie man einen Test-Build anfragt.',
    },
    layout: 'image-left',
    images: [
      {
        src: '/timeline/zombieescape.webp',
        alt: { en: 'ZombieEscape key art', de: 'ZombieEscape-Titelbild' },
        fit: 'cover',
      },
    ],
    tags: ['android', 'game-development', 'gps'],
    project: 'ZombieEscape-Preview',
  },
  {
    id: 'gpg-meister',
    status: 'done',
    date: '2026-05-12',
    title: 'GPG-Meister',
    text: {
      en: 'A local desktop app around GnuPG: create and import keys, encrypt and sign messages.',
      de: 'Eine lokale Desktop-App rund um GnuPG: Schlüssel erstellen und importieren, Nachrichten verschlüsseln und signieren.',
    },
    aside: {
      en: 'Exports protected backups. Built with Python and Qt 6, runs on Linux and Windows.',
      de: 'Exportiert geschützte Backups. Gebaut mit Python und Qt 6, läuft unter Linux und Windows.',
    },
    layout: 'image-center',
    images: [
      {
        src: '/timeline/gpg-meister.webp',
        alt: { en: 'GPG-Meister logo', de: 'GPG-Meister-Logo' },
        fit: 'contain',
      },
    ],
    tags: ['gnupg', 'pyside6', 'privacy'],
    project: 'GPG-Meister',
  },
  {
    id: 'emg',
    status: 'done',
    date: '2026-05-09',
    title: 'AD8232-EMG',
    text: {
      en: 'Wireless surface EMG with an ESP32 and the AD8232: real-time WiFi streaming, OTA updates, automatic calibration and a small Python GUI.',
      de: 'Drahtloses Oberflächen-EMG mit ESP32 und AD8232: Echtzeit-Übertragung per WLAN, OTA-Updates, automatische Kalibrierung und eine kleine Python-Oberfläche.',
    },
    layout: 'text',
    tags: ['esp32', 'biosignals', 'python'],
    project: 'AD8232-EMG',
  },
  {
    id: 'esp32-series',
    status: 'done',
    date: '2026-02',
    title: { en: 'ESP32 firmware series', de: 'ESP32-Firmware-Reihe' },
    text: {
      en: 'Security labs, a LoRa mesh server with AES-256-GCM, a USB HID key and a launcher that switches firmware from an SD card.',
      de: 'Sicherheits-Labs, ein LoRa-Mesh-Server mit AES-256-GCM, ein USB-HID-Schlüssel und ein Launcher, der Firmware von der SD-Karte wechselt.',
    },
    layout: 'text',
    tags: ['esp32', 'lora', 'firmware'],
    project: 'ESP32-LoRa-Mesh-Server',
  },
  {
    id: 'anps',
    status: 'done',
    date: '2026-01-22',
    title: 'ANPS-TradeMeUp',
    text: {
      en: 'An LLM-based news prediction system for short- to medium-term market forecasts, with real-time analysis and a Dash dashboard.',
      de: 'Ein LLM-gestütztes System zur Nachrichtenauswertung für kurz- bis mittelfristige Marktprognosen, mit Echtzeitanalyse und Dash-Dashboard.',
    },
    layout: 'image-right',
    images: [
      {
        src: '/timeline/anps-trademeup.webp',
        alt: { en: 'ANPS logo', de: 'ANPS-Logo' },
        fit: 'cover',
      },
    ],
    tags: ['llm', 'fastapi', 'postgresql'],
    project: 'ANPS-TradeMeUp',
  },
  {
    id: 'first-projects',
    status: 'done',
    date: '2025-10',
    title: { en: 'First public projects', de: 'Erste öffentliche Projekte' },
    text: {
      en: 'Crawllama, a local AI research agent on Ollama, and GeoGrabber, an Android app for mapping WiFi and Bluetooth signals.',
      de: 'Crawllama, ein lokaler KI-Recherche-Agent auf Ollama, und GeoGrabber, eine Android-App zum Kartieren von WLAN- und Bluetooth-Signalen.',
    },
    layout: 'images-sides',
    images: [
      {
        src: '/timeline/crawllama.webp',
        alt: { en: 'Crawllama logo', de: 'Crawllama-Logo' },
        fit: 'contain',
      },
      {
        src: '/repo-icons/geograbber.png',
        alt: { en: 'GeoGrabber icon', de: 'GeoGrabber-Icon' },
        fit: 'contain',
      },
    ],
    tags: ['ollama', 'rag', 'android'],
    project: 'Crawllama',
  },
]

export default timeline
