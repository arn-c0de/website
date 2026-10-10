'use client'

import { activityDomain, formatSpan, type ActivityMonth, type LanguageSlice, type ProjectSpan } from '@/lib/stats'

/**
 * Hand-drawn SVG charts — no charting library, no runtime data fetching, no
 * canvas. Each one is plain markup sized in its own user units and scaled by
 * the viewBox, so it stays crisp at any width and prints properly.
 *
 * Two rules everything here follows:
 *
 *  · Colour comes from `currentColor` and CSS custom properties, so a chart
 *    switches theme with the rest of the page instead of carrying hard-coded
 *    greys. Only the per-language hues are computed, and those are the same
 *    hues the language dots and bars already use.
 *  · Dynamic state travels on `data-*` attributes, never in `className`.
 *    The scroll-reveal observer writes `is-in` onto the DOM node directly; if
 *    React rewrote `className` on hover it would wipe that class and the
 *    element would drop back to `opacity: 0`.
 */

/* ── Language ring ────────────────────────────────────────────────────────── */

const RING_R = 46
const RING_C = 2 * Math.PI * RING_R
/** Gap between segments, in path units — keeps neighbouring hues apart. */
const RING_GAP = 2.5

export function LanguageRing({
  slices,
  active,
  onActive,
  onSelect,
}: {
  slices: LanguageSlice[]
  /** Language the pane is currently highlighting, shared with the bar list. */
  active: string | null
  onActive: (language: string | null) => void
  onSelect: (language: string) => void
}) {
  if (slices.length === 0) return null

  const total = slices.reduce((sum, s) => sum + s.count, 0)
  const shown = slices.find((s) => s.name === active) ?? null

  let offset = 0

  return (
    <svg
      className="ring"
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Share of repositories per language: ${slices
        .map((s) => `${s.name} ${s.count}`)
        .join(', ')}`}
    >
      <circle className="ring__base" cx="60" cy="60" r={RING_R} />

      {/* Starts at twelve o'clock rather than three. */}
      <g transform="rotate(-90 60 60)">
        {slices.map((slice) => {
          const length = Math.max(1, slice.share * RING_C - RING_GAP)
          const segment = (
            <circle
              key={slice.name}
              className="ring__seg"
              cx="60"
              cy="60"
              r={RING_R}
              stroke={`hsl(${slice.hue} 62% 58%)`}
              strokeDasharray={`${length} ${RING_C - length}`}
              strokeDashoffset={-offset}
              data-dim={active !== null && active !== slice.name}
              onPointerEnter={() => onActive(slice.name)}
              onPointerLeave={() => onActive(null)}
              onClick={() => onSelect(slice.name)}
            >
              <title>{`${slice.name} — ${slice.count} of ${total} repositories`}</title>
            </circle>
          )
          offset += slice.share * RING_C
          return segment
        })}
      </g>

      {/* The middle answers whatever the pointer is on, and falls back to the
          total when it is on nothing. */}
      <text className="ring__value" x="60" y="59" textAnchor="middle">
        {shown ? shown.count : total}
      </text>
      <text className="ring__label" x="60" y="72" textAnchor="middle">
        {shown ? shown.name : 'repos'}
      </text>
    </svg>
  )
}

/* ── Activity over time ───────────────────────────────────────────────────── */

const A = { w: 720, h: 190, left: 30, right: 10, top: 14, bottom: 30 }
const A_PLOT_W = A.w - A.left - A.right
const A_PLOT_H = A.h - A.top - A.bottom

/**
 * How many projects were running in a given month (area) and how many started
 * in it (bars), on one scale. The area is the shape worth reading; the bars
 * explain where it steps up.
 */
export function ActivityChart({ months }: { months: ActivityMonth[] }) {
  if (months.length === 0) return null

  const max = Math.max(1, ...months.map((m) => m.active))
  const step = A_PLOT_W / months.length
  const centre = (i: number) => A.left + step * (i + 0.5)
  const y = (value: number) => A.top + A_PLOT_H * (1 - value / max)
  const base = A.top + A_PLOT_H

  // Every month if they fit, otherwise every second or third one.
  const tick = months.length <= 13 ? 1 : months.length <= 26 ? 2 : 3
  const barW = Math.min(18, step * 0.46)

  const line = months.map((m, i) => `${centre(i).toFixed(1)},${y(m.active).toFixed(1)}`)
  // The fill closes under the first and last reading rather than at the edges
  // of the plot — running it out to the frame would draw a ramp up from zero
  // in months that are simply outside the data.
  const area = `M${centre(0)},${base} L${line.join(' L')} L${centre(months.length - 1)},${base} Z`

  return (
    <figure className="chart" data-reveal>
      {/* Below its minimum width the chart scrolls inside the card rather than
          shrinking the axis labels past reading size. */}
      <div className="chart__scroll">
        <svg
          viewBox={`0 0 ${A.w} ${A.h}`}
          role="img"
          aria-label={`Projects running per month, from ${months[0].label} 20${months[0].year} to ${
            months[months.length - 1].label
          } 20${months[months.length - 1].year}. Peak of ${max} at once.`}
        >
          {/* Horizontal rules at nothing, half and the peak. */}
          {[0, Math.round(max / 2), max].map((value) => (
            <g key={value}>
              <line
                className="chart__grid"
                x1={A.left}
                x2={A.w - A.right}
                y1={y(value)}
                y2={y(value)}
              />
              <text className="chart__tick" x={A.left - 7} y={y(value) + 3} textAnchor="end">
                {value}
              </text>
            </g>
          ))}

          {months.map((m, i) =>
            m.started > 0 ? (
              <rect
                key={m.at}
                className="chart__bar"
                x={centre(i) - barW / 2}
                y={y(m.started)}
                width={barW}
                height={base - y(m.started)}
                rx="3"
                style={{ '--i': i } as React.CSSProperties}
              >
                <title>{`${m.label} 20${m.year} — ${m.started} started, ${m.active} running`}</title>
              </rect>
            ) : null,
          )}

          <path className="chart__area" d={area} />
          <polyline className="chart__line" points={line.join(' ')} pathLength={1} />

          {months.map((m, i) => (
            <circle key={m.at} className="chart__dot" cx={centre(i)} cy={y(m.active)} r="2.6">
              <title>{`${m.label} 20${m.year} — ${m.active} running`}</title>
            </circle>
          ))}

          {months.map((m, i) =>
            i % tick === 0 ? (
              <text
                key={m.at}
                className="chart__tick"
                x={centre(i)}
                y={A.h - 10}
                textAnchor="middle"
              >
                {m.label === 'Jan' || i === 0 ? `${m.label} ${m.year}` : m.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      <figcaption className="chart__legend">
        <span className="chart__key chart__key--area">Projects running</span>
        <span className="chart__key chart__key--bar">Started that month</span>
      </figcaption>
    </figure>
  )
}

/* ── Project timeline ─────────────────────────────────────────────────────── */

const S = { w: 800, label: 168, plot: 176, right: 12, head: 22, row: 19 }
const S_PLOT_W = S.w - S.plot - S.right
/** Names longer than this are cut — the lane, not the label, is the content. */
const S_NAME_MAX = 21

/**
 * One lane per repository, from its first commit to its last push, on the same
 * months the activity chart uses. It answers "what was I on, and when" in a
 * single look; a lane opens that project.
 */
export function SpanChart({
  spans,
  months,
  onOpen,
}: {
  spans: ProjectSpan[]
  months: ActivityMonth[]
  onOpen: (name: string) => void
}) {
  if (spans.length === 0 || months.length === 0) return null

  const [from, to] = activityDomain(months)
  const x = (t: number) => S.plot + ((t - from) / (to - from)) * S_PLOT_W
  const height = S.head + spans.length * S.row + 6
  const tick = months.length <= 13 ? 1 : months.length <= 26 ? 2 : 3

  return (
    <figure className="chart chart--lanes" data-reveal>
      <div className="chart__scroll">
        <svg viewBox={`0 0 ${S.w} ${height}`} role="group" aria-label="Project timeline">
          {months.map((m, i) => (
            <g key={m.at}>
              <line
                className="chart__grid"
                x1={x(m.at)}
                x2={x(m.at)}
                y1={S.head - 8}
                y2={height - 4}
              />
              {i % tick === 0 && (
                <text className="chart__tick" x={x(m.at) + 4} y={S.head - 12}>
                  {m.label === 'Jan' || i === 0 ? `${m.label} ${m.year}` : m.label}
                </text>
              )}
            </g>
          ))}

          {spans.map((span, i) => {
            const top = S.head + i * S.row
            const middle = top + S.row / 2
            const start = x(span.from)
            // A repository pushed the day it was created still needs a mark.
            const width = Math.max(6, x(span.to) - start)
            const colour = `hsl(${span.hue} 62% 58%)`
            const name =
              span.title.length > S_NAME_MAX ? `${span.title.slice(0, S_NAME_MAX - 1)}…` : span.title

            return (
              <g
                key={span.name}
                className="lane"
                role="button"
                tabIndex={0}
                aria-label={`Open ${span.title} — ${span.language ?? 'no language'}, active ${formatSpan(
                  span.from,
                  span.to,
                )}`}
                onClick={() => onOpen(span.name)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return
                  e.preventDefault()
                  onOpen(span.name)
                }}
                style={{ '--i': i } as React.CSSProperties}
              >
                <title>{`${span.title} — active ${formatSpan(span.from, span.to)}`}</title>
                <rect className="lane__hit" x="2" y={top} width={S.w - 4} height={S.row} rx="6" />
                <text className="lane__name" x={S.label} y={middle + 3.4} textAnchor="end">
                  {name}
                </text>
                <rect
                  className="lane__bar"
                  x={start}
                  y={middle - 4}
                  width={width}
                  height="8"
                  rx="4"
                  fill={colour}
                />
                <circle className="lane__end" cx={start + width} cy={middle} r="3.4" fill={colour} />
              </g>
            )
          })}
        </svg>
      </div>
    </figure>
  )
}
