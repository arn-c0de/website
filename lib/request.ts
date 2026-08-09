import type { Project } from './types'

/**
 * Where inquiries go. Deliberately separate from the secure-contact address on
 * the Contact tab, so ordinary mail never lands in the disclosure channel.
 */
export const INQUIRY_EMAIL = 'info.arn-c0de@protonmail.com'

/** Most mail clients choke on very long mailto URLs; Outlook is the strictest. */
export const MAILTO_LIMIT = 1900

/**
 * Neutral wording on purpose: this is a way to get in touch about the work,
 * not a price list. No "commissioned", no rates, no budget field.
 */
export const INQUIRY_TYPES = [
  { id: 'question', label: 'Question about a project' },
  { id: 'build', label: 'Something you would like built' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'issue', label: 'Bug or feature request' },
  { id: 'other', label: 'Something else' },
] as const

export type InquiryTypeId = (typeof INQUIRY_TYPES)[number]['id']

/**
 * The pickable catalogue. Long enough to need the search box in the modal, and
 * every entry maps to work that actually exists in the repositories.
 * `keywords` only feeds the search — it never appears in the UI.
 */
export const SERVICE_AREAS = [
  { id: 'unsure', title: "I'm not sure yet", keywords: 'help advice unclear discuss scoping unsure' },
  { id: 'firmware', title: 'ESP32 & Arduino firmware', keywords: 'embedded microcontroller esp32 esp8266 arduino c cpp platformio' },
  { id: 'lora', title: 'LoRa & mesh networking', keywords: 'radio rf long range mesh multi-hop relay lorawan' },
  { id: 'sensors', title: 'Sensors & data acquisition', keywords: 'adc emg biosignal measurement sampling gpio spectrum fft oscilloscope' },
  { id: 'hid', title: 'USB HID & input devices', keywords: 'keyboard macro pad atmega32u4 pro micro encoder button panel joystick' },
  { id: 'wireless', title: 'WiFi & Bluetooth scanning', keywords: 'wardriving ble beacon signal mapping survey rssi' },
  { id: 'ota', title: 'OTA updates & device management', keywords: 'firmware update provisioning fleet bootloader sd card launcher' },
  { id: 'netmon', title: 'Network monitoring', keywords: 'traffic flows live view connections bandwidth ntopng' },
  { id: 'capture', title: 'Packet capture & analysis', keywords: 'pcap wireshark tcpdump sniffing fritzbox forensics' },
  { id: 'detection', title: 'Intrusion & flood detection', keywords: 'ids arp spoofing dhcp syn flood firewall nftables defence' },
  { id: 'crypto', title: 'Encryption & key management', keywords: 'pgp gnupg gpg openpgp keys signing backup secure storage aes' },
  { id: 'hardening', title: 'Server hardening & monitoring', keywords: 'linux ssh login alerts ntfy observability logs auditing vps' },
  { id: 'llm', title: 'Local LLMs & RAG', keywords: 'ollama assistant retrieval augmented generation embeddings vector offline ai' },
  { id: 'osint', title: 'Web research & OSINT', keywords: 'scraping crawling ethical automation sources multi-hop reasoning' },
  { id: 'pipelines', title: 'Data pipelines & APIs', keywords: 'fastapi postgresql alembic etl ingestion backend rest scheduling' },
  { id: 'dashboards', title: 'Dashboards & visualisation', keywords: 'realtime charts plots globe map dash plotly websocket telemetry' },
  { id: 'desktop', title: 'Desktop applications', keywords: 'qt qt6 pyside gui cross-platform windows linux tkinter' },
  { id: 'android', title: 'Android apps', keywords: 'kotlin jetpack compose mobile mvvm offline sqlcipher room' },
  { id: 'geo', title: 'Maps & geolocation', keywords: 'gps routing markers navigation offline tiles coordinates' },
  { id: 'npcai', title: 'Game AI & NPC goal systems', keywords: 'npc goal system utility ai behaviour tree goap decision making steering pathfinding unity csharp enemy' },
  { id: 'rpgcombat', title: 'Round-based RPG combat systems', keywords: 'turn based fight battle initiative order abilities skills damage formulas stats loot balancing rpg' },
  { id: 'gamesim', title: 'Deterministic simulation & replays', keywords: 'lockstep fixed point tick simulation core replay determinism headless testing rts game' },
] as const

export type ServiceAreaId = (typeof SERVICE_AREAS)[number]['id']

export const TIMELINES = [
  'No fixed date',
  'As soon as possible',
  'Within a month',
  'Within three months',
  'Later this year',
] as const

export interface RequestDraft {
  name: string
  email: string
  type: InquiryTypeId
  areas: ServiceAreaId[]
  timeline: (typeof TIMELINES)[number]
  message: string
  projects: Project[]
}

export function typeOf(id: InquiryTypeId) {
  return INQUIRY_TYPES.find((t) => t.id === id) ?? INQUIRY_TYPES[0]
}

export function areaTitles(ids: readonly ServiceAreaId[]): string[] {
  return SERVICE_AREAS.filter((a) => ids.includes(a.id)).map((a) => a.title)
}

function pad(label: string): string {
  return (label + ':').padEnd(11, ' ')
}

/** A label plus continuation lines aligned under it. */
function block(label: string, values: string[]): string[] {
  return values.map((v, i) => (i === 0 ? pad(label) : ' '.repeat(11)) + v)
}

export function buildSubject(draft: RequestDraft): string {
  const type = typeOf(draft.type).label
  const projects = draft.projects.map((p) => p.title)
  const areas = areaTitles(draft.areas.filter((id) => id !== 'unsure'))

  const focus = projects.length ? projects : areas
  if (focus.length === 1) return `${type} — ${focus[0]}`
  if (focus.length > 1) return `${type} — ${focus[0]} +${focus.length - 1} more`
  return type
}

/**
 * A plain-text email the visitor only has to send. Everything is assembled in
 * the browser; nothing is transmitted until their own mail client sends it.
 */
export function buildBody(draft: RequestDraft): string {
  const lines: string[] = ['Hello arn-c0de,', '']

  lines.push(draft.message.trim() || '(no message)', '')

  lines.push('— Request —')
  lines.push(pad('Type') + typeOf(draft.type).label)

  const areas = areaTitles(draft.areas)
  if (areas.length) lines.push(...block('Areas', areas))

  if (draft.projects.length) {
    lines.push(...block('Projects', draft.projects.map((p) => `${p.title} — ${p.html_url}`)))
  }

  lines.push(pad('Timeline') + draft.timeline)
  lines.push('')

  lines.push('— Contact —')
  lines.push(pad('Name') + (draft.name.trim() || '(not given)'))
  lines.push(pad('Email') + (draft.email.trim() || '(not given)'))

  return lines.join('\n')
}

export function buildMailto(draft: RequestDraft): string {
  const params = new URLSearchParams({
    subject: buildSubject(draft),
    body: buildBody(draft),
  })
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  return `mailto:${INQUIRY_EMAIL}?${params.toString().replace(/\+/g, '%20')}`
}

/** Rough check — a full RFC 5322 validation is not worth the false negatives. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}
