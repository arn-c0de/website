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
  /**
   * A longer write-up, shown only on the entry's own page (/timeline/<id>/)
   * under the short text. Separate paragraphs with a blank line.
   */
  body?: Localized
  layout?: TimelineLayout
  /** Pictures and videos, in the order the layout places them. */
  media?: TimelineMedia[]
  /** Older name for `media` — pictures only; still read. */
  images?: TimelineImage[]
  tags?: string[]
  /** Repository name — adds an "Open project" button that opens its panel. */
  project?: string
  links?: { label: Localized; href: string }[]
  /**
   * Marks the entry as looking for help: the areas are listed in a highlighted
   * box with a "Help out" button to `href`.
   */
  help?: { areas: Localized[]; href: string }
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
  handle: '@arn-c0de',
  channelId: 'UCQ58aokXYmIvWVTtIL7ZMBg',
  max: 12,
  includeShorts: true,
  hidden: [],
  overrides: {},
}

/** Shown under the "Planned" heading; leave empty for none. */
export const plannedNote: Localized = {
  en: 'Target dates come from the QLink plan of 27 September 2026 — estimates, not promises.',
  de: 'Zieltermine aus dem QLink-Plan vom 27. September 2026 — Schätzungen, keine Zusagen.',
}

/**
 * What QLink is looking for help with, and where offers land (the issue
 * template in the preview repository). The overview's "Currently building"
 * card shows the same list.
 */
export const qlinkHelp: NonNullable<TimelineEntry['help']> = {
  areas: [
    { en: 'Sound design', de: 'Sound-Design' },
    { en: '3D models and meshes', de: '3D-Modelle und Meshes' },
    { en: 'Texturing', de: 'Texturierung' },
  ],
  href: 'https://github.com/arn-c0de/QLink-preview/issues/new?template=offer-help.yml',
}

const timeline: TimelineEntry[] = [
  // ── Planned ────────────────────────────────────────────────────────────
  // QLink roadmap, plan of 2026-09-27. Dates are the likely-case targets from
  // that plan, not promises; move them when the milestone tracker moves.
  {
    id: 'qlink-shared-room',
    status: 'planned',
    date: '2027-07',
    when: { en: '2nd half of 2027', de: '2. Hälfte 2027' },
    title: { en: 'QLink: shared room for two players', de: 'QLink: gemeinsamer Raum für zwei Spieler' },
    text: {
      en: 'Two people in the same QLink world, with its own network protocol and privacy design.',
      de: 'Zwei Personen in derselben QLink-Welt, mit eigenem Netzwerkprotokoll und Datenschutzkonzept.',
    },
    layout: 'text',
    tags: ['multiplayer', 'void-world'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-beta',
    status: 'planned',
    date: '2027-06',
    when: { en: 'About June 2027', de: 'Etwa Juni 2027' },
    title: { en: 'QLink public beta', de: 'Öffentliche QLink-Beta' },
    text: {
      en: 'Installable packages, a list of exactly tested hardware and published performance measurements. Earliest April, latest October 2027.',
      de: 'Installierbare Pakete, eine Liste genau getesteter Hardware und veröffentlichte Leistungsmessungen. Frühestens April, spätestens Oktober 2027.',
    },
    layout: 'text',
    tags: ['M8', 'M9', 'linux'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-launcher',
    status: 'planned',
    date: '2027-04',
    title: { en: 'Start Steam games from QLink', de: 'Steam-Spiele aus QLink starten' },
    text: {
      en: 'The QLink home launches OpenXR apps and Steam titles and returns afterwards — the step that replaces the Quest Link PC app.',
      de: 'Die QLink-Umgebung startet OpenXR-Apps und Steam-Spiele und kehrt danach zurück — der Schritt, der die Quest-Link-PC-App ersetzt.',
    },
    layout: 'text',
    tags: ['M7', 'steam', 'pcvr'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-audio',
    status: 'planned',
    date: '2027-03',
    title: { en: 'Audio and controller vibration', de: 'Ton und Controller-Vibration' },
    text: {
      en: 'Headset sound, microphone and haptics. Depends on new observations first; if they take too long, the beta ships without it and says so.',
      de: 'Ton im Headset, Mikrofon und Vibration. Hängt zuerst von neuen Beobachtungen ab; dauern die zu lange, kommt die Beta ohne und sagt das offen.',
    },
    layout: 'text',
    tags: ['M6', 'audio', 'haptics'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-openxr',
    status: 'planned',
    date: '2027-02',
    title: { en: 'OpenXR runtime alpha', de: 'OpenXR-Runtime als Alpha' },
    text: {
      en: 'QLink becomes an OpenXR runtime on Linux, so standard VR applications can render to the Quest 3.',
      de: 'QLink wird zur OpenXR-Runtime unter Linux, damit normale VR-Anwendungen auf die Quest 3 rendern können.',
    },
    layout: 'text',
    tags: ['M5', 'openxr', 'vulkan'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-service',
    status: 'planned',
    date: '2026-12',
    title: { en: 'QLink as a background service', de: 'QLink als Hintergrunddienst' },
    text: {
      en: 'A small service owns the USB connection without root rights; everything else talks to it.',
      de: 'Ein kleiner Dienst übernimmt die USB-Verbindung ohne Root-Rechte; alles andere spricht mit ihm.',
    },
    layout: 'text',
    tags: ['M4', 'linux'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-gpu',
    status: 'planned',
    date: '2026-11',
    title: { en: 'Full resolution on the GPU', de: 'Volle Auflösung auf der GPU' },
    text: {
      en: 'The headset picture rendered with Vulkan at full resolution and handed straight to the hardware encoder, at a steady 72 Hz.',
      de: 'Das Headset-Bild mit Vulkan in voller Auflösung gerendert und direkt an den Hardware-Encoder übergeben, stabil mit 72 Hz.',
    },
    layout: 'text',
    tags: ['M3', 'vulkan', 'nvenc'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-sound',
    status: 'planned',
    date: '2026-10',
    when: { en: 'Next', de: 'Als Nächstes' },
    title: { en: 'QLink: sound design', de: 'QLink: Sound-Design' },
    text: {
      en: 'The world gets its sound: ambience, weather from light rain to thunder, water and waves, footsteps and interface sounds. Help is welcome here — and with 3D models and textures for the world.',
      de: 'Die Welt bekommt ihren Klang: Atmosphäre, Wetter vom leichten Regen bis zum Donner, Wasser und Wellen, Schritte und Bedienklänge. Hier ist Hilfe willkommen — ebenso bei 3D-Modellen und Texturen für die Welt.',
    },
    layout: 'text',
    tags: ['sound-design', 'audio', 'help-wanted'],
    project: 'QLink-preview',
    help: qlinkHelp,
  },

  // ── In progress ────────────────────────────────────────────────────────
  {
    id: 'qlink',
    status: 'now',
    date: '2026-10',
    title: 'QLink',
    text: {
      en: 'A Rust game and simulation engine for Linux that drives the Quest 3 over USB without the Quest Link PC app. Current focus: a session that stays stable and reconnects cleanly, complete controller input, and the editor, avatar and world.',
      de: 'Eine Spiel- und Simulations-Engine in Rust für Linux, die die Quest 3 per USB ohne Quest-Link-PC-App ansteuert. Aktueller Fokus: eine Sitzung, die stabil bleibt und sauber neu verbindet, vollständige Controller-Eingabe sowie Editor, Avatar und Welt.',
    },
    layout: 'text',
    tags: ['M1', 'M2', 'rust', 'linux'],
    project: 'QLink-preview',
    help: qlinkHelp,
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
    id: 'qlink-weather',
    status: 'done',
    date: '2026-10-11',
    title: {
      en: 'QLink: clear sky to thunderstorm, and FLUID waves',
      de: 'QLink: von klarem Himmel bis Gewitter, dazu FLUID-Wellen',
    },
    text: {
      en: 'QLink now has dynamic weather: the sky moves from clear to a full thunderstorm in real time. The video also shows the new FLUID wave system and a short look at the editor.',
      de: 'QLink hat jetzt dynamisches Wetter: Der Himmel wechselt in Echtzeit von klar bis zum Gewitter. Das Video zeigt außerdem das neue FLUID-Wellensystem und einen kurzen Blick in den Editor.',
    },
    layout: 'image-left',
    media: [
      {
        youtube: 'https://www.youtube.com/watch?v=nk8gpHifNbc',
        title: { en: 'QLink weather and FLUID waves', de: 'QLink-Wetter und FLUID-Wellen' },
      },
    ],
    tags: ['weather', 'fluid', 'editor', 'rust'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-feasibility',
    status: 'done',
    date: '2026-09-26',
    title: { en: 'QLink: first picture on the Quest 3', de: 'QLink: erstes Bild auf der Quest 3' },
    text: {
      en: 'First commit, and within a day of native work: connection, head tracking and a displayed video stream over USB — without the Quest Link PC app, on one Quest 3.',
      de: 'Erster Commit und innerhalb eines Tages nativer Arbeit: Verbindung, Kopf-Tracking und ein angezeigter Videostream per USB — ohne Quest-Link-PC-App, auf einer Quest 3.',
    },
    layout: 'text',
    tags: ['M0', 'usb', 'hevc'],
    project: 'QLink-preview',
  },
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
