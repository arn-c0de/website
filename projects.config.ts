/**
 * The one file you edit to change what the site shows.
 *
 * Repository data is pulled live from the GitHub API at runtime; everything in
 * here decides which of those repos appear, in what order, and with what text.
 * Nothing else needs touching — commit a change here and the deploy workflow
 * publishes it.
 */

export interface ProjectOverride {
  /** Replaces the repo name as the card headline. */
  title?: string
  /** Replaces the GitHub description. Use when the repo blurb reads poorly. */
  description?: string
  /** Forces a category instead of letting it be inferred from topics. */
  category?: string
  /** Replaces the repo's topic list for display and filtering. */
  topics?: string[]
  /** Extra links shown in the detail panel (demo, docs, release, …). */
  links?: { label: string; href: string }[]
  /** Hides this repo everywhere, same as listing it in `hidden`. */
  hidden?: boolean
  /**
   * Shows the repo even when the filters below would drop it — the case being
   * a fork of my own project while `showForks` is false. Loses to `hidden`.
   */
  show?: boolean
}

export interface SiteConfig {
  /** GitHub account the projects are read from. */
  username: string
  /** Repos listed here lead the grid, in exactly this order. */
  featured: string[]
  /** Repos listed here never appear. */
  hidden: string[]
  /** Forks are hidden unless this is true. */
  showForks: boolean
  /** Archived repos are hidden unless this is true. */
  showArchived: boolean
  /**
   * false → only `featured` is shown, everything else sits behind the
   * "show all projects" switch. true → the full list is shown immediately.
   */
  showAllByDefault: boolean
  /** Per-repo text and metadata overrides, keyed by exact repo name. */
  overrides: Record<string, ProjectOverride>
  /**
   * Category inference, evaluated top to bottom — first match wins. A repo
   * matches when one of its topics, or its language, is in `match`.
   */
  categories: { name: string; match: string[] }[]
  /** Fallback category for repos that match nothing above. */
  fallbackCategory: string
}

const config: SiteConfig = {
  username: 'arn-c0de',

  // The strongest by stars, then what is being built right now. Reorder
  // freely — this array is the display order.
  featured: [
    'Crawllama',
    'InteractiveChecklists',
    'ANPS-TradeMeUp',
    'Geograbber',
    'seclog-linux',
    'GPG-Meister',
    'Nova.AiLab',
    'Project_Nova',
    'AD8232-EMG',
    'ZombieEscape-Preview',
  ],

  // 'arn-c0de' is the profile README repo, 'website' is this website itself.
  // Drop 'website' from this list if you want the site to list
  // its own source alongside the projects.
  hidden: ['arn-c0de', 'website'],

  showForks: false,
  showArchived: false,
  // Every public repo is on the page from the start; `featured` now only
  // controls which ones lead the grid, not which ones exist.
  showAllByDefault: true,

  overrides: {
    Crawllama: {
      category: 'AI & Agents',
      links: [{ label: 'Contributing', href: 'https://github.com/arn-c0de/Crawllama#contributing' }],
    },
    InteractiveChecklists: {
      category: 'Mobile',
      links: [{ label: 'Project page', href: 'https://arn-c0de.github.io/InteractiveChecklists/' }],
    },
    'ANPS-TradeMeUp': { category: 'AI & Agents' },
    Geograbber: {
      title: 'GeoGrabber',
      category: 'Security & Networking',
    },
    'seclog-linux': { category: 'Security & Networking' },
    'GPG-Meister': { category: 'Security & Networking' },
    'AD8232-EMG': { category: 'Embedded' },
    'Nova.AiLab': {
      title: 'Nova AI Lab',
      description:
        'Deterministic simulation and diagnostics lab for the AI behind Project Nova / Hashkrieg: NPC goal systems, round-based RPG fights and movement run headless, so a change can be replayed, measured and compared against the branch before it.',
      category: 'Games & Simulation',
      links: [{ label: 'The game', href: 'https://github.com/arn-c0de/Project_Nova' }],
    },
    // A fork of my own repository, so `show` is what keeps it on the page.
    Project_Nova: {
      title: 'Hashkrieg',
      description:
        'Real-time strategy game in the Command & Conquer tradition. Unity 6 and C#, with a deterministic simulation core that runs without Unity, developed in the open. Working title moving from Project Nova to Hashkrieg.',
      category: 'Games & Simulation',
      show: true,
      links: [{ label: 'AI lab', href: 'https://github.com/arn-c0de/Nova.AiLab' }],
    },
    'ZombieEscape-Preview': {
      title: 'ZombieEscape',
      description:
        'Open-world, location-based zombie survival game for Android. Development preview with screenshots, test builds and contribution info.',
      category: 'Mobile',
    },

    // Repos with thin GitHub descriptions.
    'ATMEGA-ButtonPanel': {
      description:
        'ATmega32U4 flight panel with 16-channel multiplexer, rotary encoder and 19+ inputs.',
      category: 'Embedded',
    },
    'ESP32-LABs': {
      description: 'ESP32 laboratory firmware and experiments for red/blue team exercises.',
      category: 'Embedded',
    },
    // Tagged as JavaScript because of its web UI, but the project is firmware.
    'ESP-Pin-spectrum-monitor': { category: 'Embedded' },
    'A-AIO-process-optimization-and-training': {
      title: 'AIO Process Optimization',
      description:
        'Prototyping ground for AOI/AI concepts, built as clean and reproducible building blocks. Proprietary — source is published for reference only.',
      category: 'AI & Agents',
    },
  },

  categories: [
    {
      name: 'AI & Agents',
      match: ['rag', 'llm', 'local-llm', 'knowledge-retrieval', 'multi-hop-reasoning', 'news-analysis', 'market-prediction'],
    },
    {
      name: 'Games & Simulation',
      match: [
        'game-ai', 'npc-goals', 'game-development', 'unity', 'rts', 'turn-based-combat',
        'simulation', 'deterministic-simulation', 'ai-simulation', 'combat-simulation',
        'replay-system', 'C#',
      ],
    },
    {
      name: 'Security & Networking',
      match: [
        'cybersecurity', 'infosec', 'network-security', 'network-monitoring', 'packet-capture',
        'packet-sniffing', 'threat-detection', 'flood-detection', 'arp-spoofing', 'privacy',
        'cryptography', 'encryption', 'gpg', 'openpgp', 'osint', 'wardriving', 'network-analysis',
      ],
    },
    {
      name: 'Embedded',
      match: ['esp32', 'arduino', 'embedded', 'iot', 'lora', 'hid', 'atmega32u4', 'signal-processing', 'C', 'C++'],
    },
    {
      name: 'Mobile',
      match: ['android', 'android-application', 'jetpack-compose', 'mobile-app', 'Kotlin', 'Java'],
    },
  ],

  fallbackCategory: 'Tools',
}

export default config
