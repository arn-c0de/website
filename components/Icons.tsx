/** Inline icons — no icon package, no external requests. */

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function SearchIcon() {
  return (
    <svg {...base} width={15} height={15}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg {...base}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" width={12} height={12} fill="currentColor" aria-hidden>
      <path d="M8 1.6l1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.1l-3.7 2 .8-4.2L2 6l4.2-.5z" />
    </svg>
  )
}

export function ForkIcon() {
  return (
    <svg {...base} width={13} height={13}>
      <circle cx="4" cy="3.5" r="1.8" />
      <circle cx="12" cy="3.5" r="1.8" />
      <circle cx="8" cy="12.5" r="1.8" />
      <path d="M4 5.3v1.4c0 1 .8 1.8 1.8 1.8h4.4c1 0 1.8-.8 1.8-1.8V5.3M8 8.5v2.2" />
    </svg>
  )
}

export function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function LinkIcon() {
  return (
    <svg {...base} width={14} height={14}>
      <path d="M6.5 9.5a2.5 2.5 0 0 0 3.5 0l2.5-2.5a2.5 2.5 0 0 0-3.5-3.5L8 4.5" />
      <path d="M9.5 6.5a2.5 2.5 0 0 0-3.5 0L3.5 9a2.5 2.5 0 0 0 3.5 3.5L8 11.5" />
    </svg>
  )
}

export function SunIcon() {
  return (
    <svg {...base} width={15} height={15}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.9 3.1l-1 1M4.1 11.9l-1 1M12.9 12.9l-1-1M4.1 4.1l-1-1" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg {...base} width={15} height={15}>
      <path d="M13.5 9.2A5.8 5.8 0 0 1 6.8 2.5a5.8 5.8 0 1 0 6.7 6.7z" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg {...base} width={14} height={14}>
      <path d="M3 8.5 6.2 12 13 4.5" />
    </svg>
  )
}

export function CopyIcon() {
  return (
    <svg {...base} width={14} height={14}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5v-1a1.5 1.5 0 0 0-1.5-1.5H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 11h1" />
    </svg>
  )
}

export function ArrowIcon() {
  return (
    <svg {...base} width={14} height={14}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

export function ChevronIcon({ dir = 'right' }: { dir?: 'left' | 'right' }) {
  return (
    <svg {...base} width={15} height={15}>
      <path d={dir === 'left' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'} />
    </svg>
  )
}

export function MailIcon() {
  return (
    <svg {...base} width={14} height={14}>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.8" />
      <path d="m2 4.5 6 4 6-4" />
    </svg>
  )
}

export function RequestIcon() {
  return (
    <svg {...base} width={15} height={15}>
      <path d="M3.2 2.5h9.6a1.7 1.7 0 0 1 1.7 1.7v6a1.7 1.7 0 0 1-1.7 1.7H7.2L4 14v-2.1h-.8a1.7 1.7 0 0 1-1.7-1.7v-6a1.7 1.7 0 0 1 1.7-1.7Z" />
      <path d="M5 6h6M5 8.5h4" />
    </svg>
  )
}

export function SendIcon() {
  return (
    <svg {...base} width={15} height={15}>
      <path d="m2 2.5 12 5.3L2 13.5l1.4-4.4L10 7.8 3.4 6.6Z" />
    </svg>
  )
}

/* Tab marks. One weight, one grid, so the row reads as a set rather than as
   five borrowed glyphs. */

export function OverviewIcon() {
  return (
    <svg {...base} width={15} height={15}>
      <rect x="2" y="2" width="5.2" height="5.2" rx="1.4" />
      <rect x="8.8" y="2" width="5.2" height="5.2" rx="1.4" />
      <rect x="2" y="8.8" width="5.2" height="5.2" rx="1.4" />
      <rect x="8.8" y="8.8" width="5.2" height="5.2" rx="1.4" />
    </svg>
  )
}

export function ProjectsIcon() {
  return (
    <svg {...base} width={15} height={15}>
      <path d="M8 1.9 14 5v6l-6 3.1L2 11V5z" />
      <path d="M2 5l6 3.1L14 5M8 8.1v6" />
    </svg>
  )
}

export function StackIcon() {
  return (
    <svg {...base} width={15} height={15}>
      <path d="M8 1.9 14.2 5 8 8.1 1.8 5z" />
      <path d="M1.8 8 8 11.1 14.2 8M1.8 11 8 14.1 14.2 11" />
    </svg>
  )
}

export function AboutIcon() {
  return (
    <svg {...base} width={15} height={15}>
      <circle cx="8" cy="5.6" r="2.9" />
      <path d="M2.6 14c.6-2.8 2.7-4.3 5.4-4.3s4.8 1.5 5.4 4.3" />
    </svg>
  )
}

/**
 * Small, locally drawn language marks for the Stack pane. They deliberately
 * share one badge shape so the mixed toolchain reads as a coherent set rather
 * than a collection of third-party logos.
 */
export function LanguageIcon({ language, size = 20 }: { language: string; size?: number }) {
  const key = language.toLowerCase()
  const specs: Record<string, { label: string; bg: string; fg: string; fontSize?: number }> = {
    c: { label: 'C', bg: '#659ad2', fg: '#fff' },
    'c++': { label: 'C++', bg: '#00599c', fg: '#fff', fontSize: 7.2 },
    'c#': { label: 'C#', bg: '#68217a', fg: '#fff', fontSize: 8.5 },
    java: { label: 'J', bg: '#e76f00', fg: '#fff' },
    javascript: { label: 'JS', bg: '#f7df1e', fg: '#171717', fontSize: 8.5 },
    kotlin: { label: 'K', bg: '#7f52ff', fg: '#fff' },
    python: { label: 'Py', bg: '#3776ab', fg: '#fff', fontSize: 8.5 },
    shell: { label: '>_', bg: '#293137', fg: '#7ee787', fontSize: 8 },
  }
  const spec = specs[key] ?? { label: '</>', bg: '#64748b', fg: '#fff', fontSize: 7 }

  return (
    <svg
      className="language-logo"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
    >
      <rect x="1" y="1" width="22" height="22" rx="6" fill={spec.bg} />

      {key === 'python' && (
        <path d="M1 14.5 23 8v9a6 6 0 0 1-6 6H7a6 6 0 0 1-6-6Z" fill="#ffd43b" />
      )}
      {key === 'kotlin' && (
        <>
          <path d="M1 1h22L1 23Z" fill="#f88909" />
          <path d="M1 23 12 12l11 11Z" fill="#e448c4" />
        </>
      )}
      {key === 'java' && (
        <path
          d="M9 8.4c2.8-1.2 4.2-2.2 3.1-3.7M11.5 9.7c3.8-1.5 5-2.9 3.4-4.7"
          fill="none"
          stroke="#fff"
          strokeWidth="1.15"
          strokeLinecap="round"
          opacity=".78"
        />
      )}

      <text
        x="12"
        y={key === 'java' ? 17.2 : 15.5}
        fill={spec.fg}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={spec.fontSize ?? 10.5}
        fontWeight="800"
        textAnchor="middle"
      >
        {spec.label}
      </text>
    </svg>
  )
}
