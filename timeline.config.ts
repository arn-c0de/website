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
  /**
   * Age-restricted on YouTube (18+). YouTube does not play those in an
   * embedded player, so the frame links to YouTube instead and says why.
   * `youtube.ageRestricted` below can mark videos without this flag.
   */
  ageRestricted?: boolean
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

export interface TimelineTable {
  caption?: Localized
  columns: Localized[]
  rows: Localized[][]
  /** A small line under the table, e.g. what the figures were measured on. */
  note?: Localized
}

export interface TimelineEntry {
  /** Unique, stable — used as the anchor in the URL. */
  id: string
  status: TimelineStatus
  /**
   * 'YYYY-MM' or 'YYYY-MM-DD'; add a time ('YYYY-MM-DDTHH:MM', UTC) to order
   * several entries of one day. Planned entries may leave it out.
   */
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
  /**
   * Tables for the entry's own page, shown under the write-up. Every row has
   * one cell per column; the first cell of a row is its heading. On a phone a
   * wide table scrolls sideways inside its frame.
   */
  tables?: TimelineTable[]
  layout?: TimelineLayout
  /** Pictures and videos, in the order the layout places them. */
  media?: TimelineMedia[]
  /** Older name for `media` — pictures only; still read. */
  images?: TimelineImage[]
  tags?: string[]
  /** Repository name — adds an "Open project" button that opens its panel. */
  project?: string
  /**
   * Further repositories the entry is about, beyond `project`. Nothing is
   * shown for them; the content audit counts the entry as their latest news.
   */
  mentions?: string[]
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
  /**
   * Videos that are 18+ on YouTube: by id, or by a word in the title (so a
   * channel upload is covered before its id is known). They link out
   * instead of embedding, with `note` as the reason.
   */
  ageRestricted?: { ids: string[]; titleIncludes: string[]; note: Localized }
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
  ageRestricted: {
    ids: ['ugbmEdZKVCA'],
    titleIncludes: ['shoothouse'],
    note: {
      en: 'Age-restricted on YouTube (18+) because of the gore simulation.',
      de: 'Auf YouTube ab 18 freigegeben, wegen der Gore-Simulation.',
    },
  },
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

  {
    id: 'agent-office-mind',
    status: 'planned',
    when: { en: 'Planned', de: 'Geplant' },
    title: { en: 'Agent Office: residents that think for themselves', de: 'Agent Office: Bewohner, die selbst nachdenken' },
    text: {
      en: 'The next layers of Agent World: a thinking cycle, decisions weighed with a model, emotions and relationships between the residents. Planned, not built yet; autonomous use stays off until the safety checks have passed.',
      de: 'Die nächsten Ebenen von Agent World: ein Denkzyklus, mit einem Modell abgewogene Entscheidungen, Gefühle und Beziehungen zwischen den Bewohnern. Geplant, noch nicht gebaut; der autonome Betrieb bleibt aus, bis die Sicherheitsprüfungen bestanden sind.',
    },
    layout: 'text',
    tags: ['agents', 'simulation', 'llm'],
    project: 'Agent-Office-private',
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
    id: 'agent-office',
    status: 'now',
    date: '2026-10',
    title: { en: 'Agent Office: an office for AI coding agents', de: 'Agent Office: ein Büro für KI-Coding-Agenten' },
    text: {
      en: 'A local control plane that runs a small team of Claude Code and Codex agents, each in its own workspace with its own budget, with approvals on the phone and the team shown as an isometric pixel-art office. On top, Agent World turns the agents into residents of a small city with needs, money and free time. Private project — test versions are available on request.',
      de: 'Eine lokale Steuerzentrale für ein kleines Team aus Claude-Code- und Codex-Agenten, jeder in einem eigenen Arbeitsbereich mit eigenem Budget, mit Freigaben am Handy und dem Team als isometrischem Pixel-Art-Büro. Darüber macht Agent World die Agenten zu Bewohnern einer kleinen Stadt mit Bedürfnissen, Geld und Freizeit. Privates Projekt — Testversionen gibt es auf Anfrage.',
    },
    layout: 'text',
    tags: ['agents', 'typescript', 'pixel-art'],
    project: 'Agent-Office-private',
  },
  {
    id: 'deepvision-synthetic-data',
    status: 'planned',
    when: { en: 'Idea', de: 'Idee' },
    title: {
      en: 'DeepVision-Web × Simple-Sim: synthetic training data',
      de: 'DeepVision-Web × Simple-Sim: synthetische Trainingsdaten',
    },
    text: {
      en: 'Under consideration: use the synthetic component and defect datasets from the Simple-Sim pipeline in AIO Process Optimization to train the own component model of DeepVision-Web for better recognition.',
      de: 'Wird geprüft: die synthetischen Bauteil- und Fehler-Datensätze der Simple-Sim-Pipeline aus AIO Process Optimization nutzen, um das eigene Bauteil-Modell von DeepVision-Web für eine bessere Erkennung zu trainieren.',
    },
    layout: 'text',
    tags: ['aoi', 'synthetic-data', 'pytorch'],
    project: 'DeepVision-Web-private',
    mentions: ['A-AIO-process-optimization-and-training'],
  },
  {
    id: 'deepvision-simpleaoi-first-run',
    status: 'done',
    date: '2026-10-23',
    title: {
      en: 'DeepVision-Web: SimpleAOI finds 30 of 30 faults on 240 boards',
      de: 'DeepVision-Web: SimpleAOI findet 30 von 30 Fehlern auf 240 Platinen',
    },
    text: {
      en: 'First productive run of the new SimpleAOI mode: it analysed the assembly photos of 240 boards for missing parts such as standoffs, screws and batteries. All 30 faults were found and marked in the picture, so nothing slipped through. Private project — only occasional previews.',
      de: 'Erster produktiver Einsatz des neuen SimpleAOI-Modus: Er hat die Montagefotos von 240 Platinen auf fehlende Teile wie Bolzen, Schrauben und Batterien geprüft. Alle 30 Fehler wurden gefunden und im Bild markiert, es ist also nichts durchgerutscht. Privates Projekt — nur vereinzelte Einblicke.',
    },
    body: {
      en: 'SimpleAOI compares each assembly photo with the expected parts and flags what is missing. In the picture, the battery holder is flagged red and three mounting points (MT1, MT5, MT8) are marked “missing”, while the parts that are present are framed green.',
      de: 'SimpleAOI vergleicht jedes Montagefoto mit den erwarteten Teilen und markiert, was fehlt. Im Bild ist der Batteriehalter rot umrahmt und drei Befestigungspunkte (MT1, MT5, MT8) sind als „missing“ markiert, vorhandene Teile sind grün umrahmt.',
    },
    layout: 'image-right',
    media: [
      {
        src: '/timeline/deepvision-simpleaoi-first-run.webp',
        alt: {
          en: 'DeepVision-Web in SimpleAOI mode: a circuit board photo with a missing battery and missing mounting points outlined in red, present parts in green',
          de: 'DeepVision-Web im SimpleAOI-Modus: Platinenfoto mit fehlender Batterie und fehlenden Befestigungspunkten rot umrandet, vorhandene Teile grün',
        },
        caption: { en: 'Missing parts flagged in red', de: 'Fehlende Teile rot markiert' },
        fit: 'contain',
      },
    ],
    tags: ['aoi', 'simpleaoi', 'inspection'],
    project: 'DeepVision-Web-private',
  },
  {
    id: 'deepvision-update-2026-10-15-bridges',
    status: 'done',
    date: '2026-10-15T20:00',
    title: { en: 'DeepVision-Web: solder bridges are found better', de: 'DeepVision-Web: Lötbrücken werden besser erkannt' },
    text: {
      en: 'Solder bridges are still the weakest kind of defect, but the new model finds them much better thanks to real examples. Of 133 defects that had no type yet, 59 were solder bridges, so the second test board now has 52 bridges on the top side instead of 15 and 20 on the bottom instead of 6, and the figures per defect type finally mean something. Private project — only occasional previews.',
      de: 'Lötbrücken sind weiter die schwächste Fehlerart, aber das neue Modell findet sie dank echter Beispiele deutlich besser. Von 133 Fehlern, die noch keine Art hatten, waren 59 Lötbrücken, die zweite Testplatine hat damit oben 52 statt 15 Brücken und unten 20 statt 6, und die Zahlen je Fehlerart sind erst jetzt aussagekräftig. Privates Projekt — nur vereinzelte Einblicke.',
    },
    body: {
      en: 'One step back: missing parts on the bottom side drop from 53 % to 33 %, but with only 15 cases that is not reliable yet. Next: more real bridge examples.',
      de: 'Ein Rückschritt: Fehlende Bauteile unten fallen von 53 % auf 33 %, bei nur 15 Fällen ist das aber noch nicht belastbar. Als Nächstes: weitere echte Brücken-Beispiele.',
    },
    tables: [
      {
        caption: { en: 'Share of defects found at 5 % false alarms', de: 'Anteil gefundener Fehler bei 5 % Fehlalarm' },
        columns: [
          { en: 'Defect type', de: 'Fehlerart' },
          { en: 'Cases', de: 'Fälle' },
          { en: 'Old model', de: 'Altes Modell' },
          { en: 'New model', de: 'Neues Modell' },
        ],
        rows: [
          [{ en: 'Top, all defects', de: 'Oben, alle Fehler' }, '120', '64 %', '81 %'],
          [{ en: 'Top, solder bridges', de: 'Oben, Lötbrücken' }, '52', '44 %', '67 %'],
          [{ en: 'Top, missing parts', de: 'Oben, fehlende Bauteile' }, '38', '71 %', '92 %'],
          [{ en: 'Top, rotated parts', de: 'Oben, verdrehte Bauteile' }, '20', '100 %', '100 %'],
          [{ en: 'Bottom, solder bridges', de: 'Unten, Lötbrücken' }, '20', '30 %', '65 %'],
          [{ en: 'Bottom, missing parts', de: 'Unten, fehlende Bauteile' }, '15', '53 %', '33 %'],
        ],
        note: {
          en: 'Measured on a board the model never saw in training.',
          de: 'Gemessen an einer Platine, die im Training nie vorkam.',
        },
      },
    ],
    layout: 'text',
    tags: ['aoi', 'ai', 'evaluation'],
    project: 'DeepVision-Web-private',
  },
  {
    id: 'deepvision-update-2026-10-15',
    status: 'done',
    date: '2026-10-15',
    title: { en: 'DeepVision-Web: AI inspection on an unseen board', de: 'DeepVision-Web: KI-Prüfung an einer unbekannten Platine' },
    text: {
      en: 'The AI inspection now spots defects well on a board it has never seen: AUC 0.96 on the top side, 0.88 on the bottom. On the top, averaged over two photos, it finds 80 % of the defects at 4.7 % false alarms; the bottom is weaker, mostly at through-hole solder joints and empty pads. That is not yet enough for a verdict of its own, so the AI still only reports a “suspicion”. Averaging several photos of the same board helps most (false alarms from 15 % with one photo to 6.5 % with five); online datasets, more training data or larger crops did not. Next: a third prepared board, a model for through-hole joints and measurements on the phone. Private project — only occasional previews.',
      de: 'Die KI-Prüfung erkennt Fehler auf einer Platine, die sie nie gesehen hat, inzwischen gut: AUC 0,96 auf der Oberseite, 0,88 auf der Unterseite. Oben findet sie im Mittel über zwei Fotos 80 % der Fehler bei 4,7 % Fehlalarm; unten ist sie schwächer, vor allem an THT-Lötstellen und leeren Pads. Für ein eigenes Urteil reicht das noch nicht, die KI meldet deshalb weiter nur „Verdacht“. Am meisten hilft es, mehrere Fotos derselben Platine zu mitteln (Fehlalarm von 15 % mit einem Foto auf 6,5 % mit fünf); Online-Datensätze, mehr Trainingsdaten oder größere Ausschnitte brachten nichts. Als Nächstes: eine dritte präparierte Platine, ein Modell für THT-Lötstellen und Messungen am Handy. Privates Projekt — nur vereinzelte Einblicke.',
    },
    layout: 'text',
    tags: ['aoi', 'ai', 'evaluation'],
    project: 'DeepVision-Web-private',
  },
  {
    id: 'deepvision-update-2026-10-13',
    status: 'done',
    date: '2026-10-13T21:00',
    title: { en: 'DeepVision-Web: project update', de: 'DeepVision-Web: Projekt-Update' },
    text: {
      en: 'The board pose now comes from the mounting holes: pins are off by 0.03 mm instead of 0.75 mm, and hard, dark photos fall back on the holes too. “Empty” crops turned out to be test points and fiducials, which are now left out. The autopilot’s first report: very good on known defects, not yet on phone photos. Private project — only occasional previews.',
      de: 'Die Lage der Platine kommt jetzt aus den Befestigungsbohrungen: Pins liegen 0,03 mm statt 0,75 mm daneben, und auch schwierige, dunkle Fotos greifen darauf zurück. „Leere“ Ausschnitte waren Prüfpunkte und Passmarken, die jetzt ausgenommen sind. Der erste Bericht des Autopiloten: sehr gut bei bekannten Fehlern, bei Handyfotos noch nicht. Privates Projekt — nur vereinzelte Einblicke.',
    },
    layout: 'text',
    tags: ['calibration', 'aoi', 'opencv'],
    project: 'DeepVision-Web-private',
  },
  {
    id: 'deepvision-aoi-autopilot',
    status: 'now',
    date: '2026-10-13T17:30',
    title: {
      en: 'DeepVision-Web: an AOI autopilot that tests and tunes itself',
      de: 'DeepVision-Web: ein AOI-Autopilot, der sich selbst prüft und nachstellt',
    },
    text: {
      en: 'New plan: instead of me checking photos by hand, an autopilot runs phone photos, videos and scans through the real app, checks whether each component box really sits on its part, rates the crops and then tunes thresholds, references and the dataset itself. Only a few labels from the phone are still up to me. Private project — only occasional previews.',
      de: 'Neuer Plan: Statt dass ich Fotos von Hand durchsehe, schickt ein Autopilot Handyfotos, Videos und Scans durch die echte App, prüft, ob jeder Bauteilrahmen wirklich auf seinem Bauteil sitzt, bewertet die Crops und stellt danach Schwellen, Referenzen und den Datensatz selbst nach. Von mir kommen nur noch ab und zu ein paar Labels vom Handy. Privates Projekt — nur vereinzelte Einblicke.',
    },
    body: {
      en: 'Where it started: on slightly tilted phone photos the component boxes often did not sit exactly on the parts. One pose for the whole board cannot follow the lens, the angle or a bent board, so a crop confirmed as OK sometimes showed bare board instead of the component. That gets a local correction field, and the fit of every crop is measured against a reference scan.\n\nFrom there it grows into a loop: run the images, measure the fit (green, yellow or red per image), rate the crops, tune, and check again. A new database of top and bottom photos with good parts and real defects helps, and for the first time it gives the bottom side a dataset of its own.\n\nNothing is adopted blindly. Every change has to pass a regression first: simulated phone photos with tilt, lens distortion, a bent board, blur and changing light, where the true position of every part is known; real photos; a set of confirmed defects and false alarms; and the labels from the phone. Only then does the autopilot write new thresholds and references, and I get the report afterwards.\n\nWhat counts as a defect: a missing or wrong part, an offset or rotated one, solder defects and foreign objects. A part that sits off by a quarter of its pad width or more counts as offset. A run takes up to about 15 minutes and starts when I ask for it. The plan is written; the building comes next, step by step.',
      de: 'Angefangen hat es so: Auf leicht schrägen Handyfotos saßen die Bauteilrahmen oft nicht genau auf den Bauteilen. Eine einzige Pose für die ganze Platine kann Objektiv, Schräglage oder eine durchgebogene Platine nicht abbilden, also zeigte ein als OK bestätigter Crop manchmal leere Platine statt Bauteil. Dafür kommt ein lokales Korrekturfeld, und der Sitz jedes Crops wird gegen einen Referenzscan gemessen.\n\nDaraus wird ein Kreislauf: Bilder durchlaufen lassen, Sitz messen (grün, gelb oder rot je Bild), Crops bewerten, nachstellen, wieder prüfen. Dabei hilft eine neue Datenbank mit Fotos von Ober- und Unterseite, mit guten Bauteilen und echten Fehlern. Die Unterseite bekommt so zum ersten Mal einen eigenen Datensatz.\n\nÜbernommen wird nichts blind. Jede Änderung muss vorher durch eine Regression: künstliche Handyfotos mit Schräglage, Verzeichnung, durchgebogener Platine, Unschärfe und wechselndem Licht, bei denen die wahre Lage jedes Bauteils bekannt ist; echte Fotos; ein Satz bestätigter Fehler und Fehlalarme; und die Labels vom Handy. Erst dann schreibt der Autopilot neue Schwellen und Referenzen, und ich bekomme den Bericht danach.\n\nAls Fehler zählen: fehlendes oder falsches Bauteil, versetzt oder verdreht, Lötfehler und Fremdkörper. Wer um ein Viertel der Pad-Breite oder mehr daneben sitzt, gilt als versetzt. Ein Lauf dauert bis etwa 15 Minuten und startet, wenn ich ihn anstoße. Der Plan steht, gebaut wird als Nächstes, Schritt für Schritt.',
    },
    layout: 'text',
    tags: ['aoi', 'autopilot', 'computer-vision'],
    project: 'DeepVision-Web-private',
  },
  {
    id: 'deepvision-smooth-tracking',
    status: 'now',
    date: '2026-10-12T21:00',
    title: {
      en: 'DeepVision-Web: tracking without the stutter',
      de: 'DeepVision-Web: Tracking ohne Ruckeln',
    },
    text: {
      en: 'On the phone the anchors now work while tracking: about 19 poses a second, the overlay visible in three of four frames, corrections of 1.5 to 14 px. The slight stutter left comes from the anchor search every two seconds; next is a cheaper feature search for it. Private project — only occasional previews.',
      de: 'Am Handy funktionieren die Anker jetzt im Track: rund 19 Posen pro Sekunde, das Overlay in drei von vier Bildern sichtbar, Korrekturen von 1,5 bis 14 px. Das restliche leichte Ruckeln kommt von der Ankersuche alle zwei Sekunden; als Nächstes eine billigere Merkmalssuche dafür. Privates Projekt — nur vereinzelte Einblicke.',
    },
    layout: 'image-right',
    media: [
      {
        src: '/timeline/deepvision-smooth-tracking.webp',
        alt: {
          en: 'DeepVision-Web at 16× zoom on a circuit board: four components framed while tracking, with camera and tracking rates in the corner',
          de: 'DeepVision-Web bei 16-fachem Zoom auf einer Platine: vier Bauteile im Track umrahmt, in der Ecke Kamera- und Tracking-Raten',
        },
        caption: { en: 'Tracking at 16×', de: 'Tracking bei 16×' },
        fit: 'contain',
      },
    ],
    tags: ['tracking', 'opencv', 'webassembly'],
    project: 'DeepVision-Web-private',
  },
  {
    id: 'deepvision-fastaoi',
    status: 'now',
    date: '2026-10',
    title: { en: 'DeepVision-Web: FastAOI with Deep Zoom', de: 'DeepVision-Web: FastAOI mit Deep Zoom' },
    text: {
      en: 'Working on FastAOI: a fast automatic optical inspection built on the stabilized Deep Zoom mode of DeepVision-Web. The board is evaluated automatically, cell by cell, and every component is judged by a model of its own. Private project — only occasional previews.',
      de: 'Arbeit am FastAOI: eine schnelle automatische optische Inspektion auf Basis des stabilisierten Deep-Zoom-Modus von DeepVision-Web. Die Platine wird automatisch Zelle für Zelle ausgewertet, jedes Bauteil von einem eigenen Modell beurteilt. Privates Projekt — nur vereinzelte Einblicke.',
    },
    layout: 'text',
    tags: ['aoi', 'computer-vision', 'webassembly'],
    project: 'DeepVision-Web-private',
  },
  {
    id: 'local-ai',
    status: 'now',
    date: '2026-10',
    title: { en: 'Local AI: ARIS, FLUID', de: 'Lokale KI: ARIS, FLUID' },
    text: {
      en: 'ARIS is a self-hosted AI agent with voice output and tool support.',
      de: 'ARIS ist ein selbst gehosteter KI-Agent mit Sprachausgabe und Werkzeugen.',
    },
    layout: 'text',
    tags: ['llm', 'agents'],
  },

  // ── Done ───────────────────────────────────────────────────────────────
  {
    id: 'deepvision-deep-zoom',
    status: 'done',
    date: '2026-10-12',
    title: { en: 'DeepVision-Web: Deep Zoom with stabilized tracking works', de: 'DeepVision-Web: Deep Zoom mit stabilisiertem Tracking funktioniert' },
    text: {
      en: 'Zooming into a single component now holds steady: tracking keeps the board in place, even with a shaky hand. It is the base FastAOI builds on. Private project — only occasional previews.',
      de: 'Das Heranzoomen an ein einzelnes Bauteil bleibt jetzt ruhig: Das Tracking hält die Platine fest, auch aus der freien Hand. Darauf baut FastAOI auf. Privates Projekt — nur vereinzelte Einblicke.',
    },
    layout: 'text',
    tags: ['computer-vision', 'webassembly'],
    project: 'DeepVision-Web-private',
  },
  {
    id: 'qlink-aircraft',
    status: 'done',
    date: '2026-10-19',
    title: {
      en: 'QLink: first aircraft simulation with three test models and dynamic weather',
      de: 'QLink: erste Flugzeugsimulation mit drei Testmodellen und dynamischem Wetter',
    },
    text: {
      en: 'The aircraft simulation is taking shape. This early preview shows three test aircraft, jets and a Cessna, flying in the simulated world, with changing weather and a first rain simulation. The focus is on the aircraft models, the flight environment and the weather. Very early; aircraft, flight model and weather are still work in progress.',
      de: 'Die Flugzeugsimulation nimmt Form an. Diese frühe Vorschau zeigt drei Testflugzeuge, Jets und eine Cessna, die durch die simulierte Welt fliegen, dazu wechselndes Wetter und eine erste Regensimulation. Im Fokus stehen die Flugzeugmodelle, die Flugumgebung und das Wetter. Sehr früh; Flugzeuge, Flugmodell und Wetter sind noch in Arbeit.',
    },
    layout: 'image-left',
    media: [
      {
        youtube: 'https://www.youtube.com/watch?v=AFjYhrOw-Ys',
        title: {
          en: 'QLink: first aircraft simulation and dynamic weather (early preview)',
          de: 'QLink: erste Flugzeugsimulation und dynamisches Wetter (frühe Vorschau)',
        },
      },
    ],
    tags: ['aircraft', 'flight-simulation', 'weather', 'rust'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-shoothouse',
    status: 'done',
    date: '2026-10-11T20:00',
    title: {
      en: 'QLink: shoothouse run with new movement, NPCs, fear and stamina',
      de: 'QLink: Shoothouse-Lauf mit neuem Movement, NPCs, Angst und Stamina',
    },
    text: {
      en: 'A cut run through the shoothouse: reworked movement, NPCs that act on their own, first sounds, a fear system the NPCs react to, and stamina. All early; values, animations and sounds will keep changing. The video is age-restricted (18+) on YouTube because of the gore simulation.',
      de: 'Ein zusammengeschnittener Lauf durchs Shoothouse: überarbeitetes Movement, NPCs, die selbst handeln, erste Sounds, ein Angstsystem, auf das die NPCs reagieren, und Stamina. Alles noch früh; Werte, Animationen und Sounds ändern sich weiter. Das Video ist auf YouTube ab 18 freigegeben, wegen der Gore-Simulation.',
    },
    layout: 'image-left',
    media: [
      {
        youtube: 'https://youtu.be/ugbmEdZKVCA',
        title: { en: 'QLink shoothouse run', de: 'QLink-Shoothouse-Lauf' },
        ageRestricted: true,
      },
    ],
    tags: ['shoothouse', 'npc', 'movement', 'audio', 'rust'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-weather-sound',
    status: 'done',
    date: '2026-10-11T17:00',
    title: {
      en: 'QLink: rain, wind and thunder now have sound',
      de: 'QLink: Regen, Wind und Gewitter jetzt mit Sound',
    },
    text: {
      en: 'The weather now has sound: rain, wind and thunder follow it as it changes, from a clear sky to a full thunderstorm. These are simple first sounds; they will be expanded step by step.',
      de: 'Das Wetter hat jetzt Sound: Regen, Wind und Gewitter folgen ihm, wenn es umschlägt, vom klaren Himmel bis zum Gewitter. Es sind einfache erste Sounds; sie werden Schritt für Schritt erweitert.',
    },
    layout: 'image-right',
    media: [
      {
        youtube: 'https://www.youtube.com/watch?v=gfXezigydU0',
        title: { en: 'QLink weather with sound', de: 'QLink-Wetter mit Sound' },
      },
    ],
    tags: ['weather', 'audio', 'sound-design', 'rust'],
    project: 'QLink-preview',
  },
  {
    id: 'qlink-weather',
    status: 'done',
    date: '2026-10-11T12:00',
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
    id: 'agent-office-start',
    status: 'done',
    date: '2026-09-27',
    title: { en: 'Agent Office: started', de: 'Agent Office: gestartet' },
    text: {
      en: 'First commit of Agent Office, a private control plane for AI coding agents: one session per agent, isolated Git worktrees, budgets and approvals before anything risky runs.',
      de: 'Erster Commit von Agent Office, einer privaten Steuerzentrale für KI-Coding-Agenten: eine Sitzung pro Agent, isolierte Git-Worktrees, Budgets und Freigaben, bevor etwas Riskantes läuft.',
    },
    layout: 'text',
    tags: ['agents', 'typescript'],
    project: 'Agent-Office-private',
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
    mentions: ['ESP32-LABs', 'ESP-ProMicro-HidKey', 'ESP32-Multi-OS-Launcher'],
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
        src: '/repo-icons/geograbber.webp',
        alt: { en: 'GeoGrabber icon', de: 'GeoGrabber-Icon' },
        fit: 'contain',
      },
    ],
    tags: ['ollama', 'rag', 'android'],
    project: 'Crawllama',
    mentions: ['Geograbber'],
  },
]

export default timeline
