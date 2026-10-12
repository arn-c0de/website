import data from '@/data/releases.json'

export interface ReleaseAsset {
  name: string
  /** Bytes. */
  size: number
  url: string
  downloads: number
}

export interface Release {
  tag: string
  name: string
  /** 'YYYY-MM-DD'. */
  date: string
  url: string
  prerelease: boolean
  /** Release notes, cleaned at build time (lib/readmeHtml.ts). */
  notes: string
  assets: ReleaseAsset[]
}

/** The latest release of a repository, from scripts/fetch-releases.mjs. */
export function latestRelease(repo: string): Release | null {
  return (data as Record<string, Release>)[repo] ?? null
}

/** 1536 → "1.5 KB", 5_400_000 → "5.1 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}
