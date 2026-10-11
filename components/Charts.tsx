'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { activityDomain, formatSpan, type ActivityMonth, type LanguageSlice, type ProjectSpan } from '@/lib/stats'
import { LanguageIcon } from './Icons'

/**
 * Hand-drawn SVG charts — no charting library, no runtime data fetching, no
 * canvas. Each one is plain markup sized in its own user units and scaled by
 * the viewBox, so it stays crisp at any width and prints properly.
 *
 * Rules everything here follows:
 *
 *  · One series, one colour. Identity is carried by text and icons, not by a
 *    hue per language — nine generated hues cannot all be told apart, least
 *    of all with a colour-vision deficiency. The accent marks what matters;
 *    everything else is ink and hairlines from the page's own tokens, so the
 *    charts switch theme with the page.
 *  · Hover adds detail but never gates it: every value is also in a label or
 *    a table view, and the keyboard reaches what the pointer does.
 *  · Dynamic state travels on `data-*` attributes, never in `className`.
 *    The scroll-reveal observer writes `is-in` onto the DOM node directly; if
 *    React rewrote `className` on hover it would wipe that class.
 */

/* ── Languages ────────────────────────────────────────────────────────────── */

/**
 * Repositories per language as one bar chart: the logo and the name say
 * which language, the bar says how many, the label gives count and share.
 * A row filters the projects tab down to its language.
 */
export function LanguageBars({
  slices,
  onSelect,
}: {
  slices: LanguageSlice[]
  onSelect: (language: string) => void
}) {
  const { t } = useI18n()
  if (slices.length === 0) return null
  const max = Math.max(1, ...slices.map((s) => s.count))

  return (
    <ul className="lbars">
      {slices.map((slice, i) => (
        <li key={slice.name}>
          <button
            type="button"
            className="lbar"
            data-reveal
            onClick={() => onSelect(slice.name)}
            title={t('Show {name} projects', { name: slice.name })}
            style={{ '--w': `${(slice.count / max) * 100}%`, '--i': i } as React.CSSProperties}
          >
            <span className="lbar__name">
              <LanguageIcon language={slice.name} size={18} />
              {slice.name}
            </span>
            <span className="lbar__track" aria-hidden>
              <span className="lbar__fill" />
            </span>
            <span className="lbar__value">
              {slice.count}
              <span className="lbar__share">{Math.round(slice.share * 100)}%</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ── Activity over time ───────────────────────────────────────────────────── */

const A = { w: 720, h: 200, left: 30, right: 10, top: 16, bottom: 30 }
const A_PLOT_W = A.w - A.left - A.right
const A_PLOT_H = A.h - A.top - A.bottom

/**
 * How many projects were running in a given month (area) and how many started
 * in it (bars), on one scale — both count projects. A crosshair follows the
 * pointer or the arrow keys and names both values for that month; the table
 * under the chart holds every number.
 */
export function ActivityChart({ months }: { months: ActivityMonth[] }) {
  const { t } = useI18n()
  const [hover, setHover] = useState<number | null>(null)
  if (months.length === 0) return null

  const max = Math.max(1, ...months.map((m) => m.active))
  const step = A_PLOT_W / months.length
  const centre = (i: number) => A.left + step * (i + 0.5)
  const y = (value: number) => A.top + A_PLOT_H * (1 - value / max)
  const base = A.top + A_PLOT_H
  const label = (m: ActivityMonth) => `${t(m.label)} 20${m.year}`

  // Every month if they fit, otherwise every second or third one.
  const tick = months.length <= 13 ? 1 : months.length <= 26 ? 2 : 3
  const barW = Math.min(14, step * 0.36)
  const peak = months.reduce((best, m, i) => (m.active > months[best].active ? i : best), 0)

  const line = months.map((m, i) => `${centre(i).toFixed(1)},${y(m.active).toFixed(1)}`)
  // The fill closes under the first and last reading rather than at the edges
  // of the plot — running it out to the frame would draw a ramp up from zero
  // in months that are simply outside the data.
  const area = `M${centre(0)},${base} L${line.join(' L')} L${centre(months.length - 1)},${base} Z`
  const shown = hover !== null ? months[hover] : null

  function onKey(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const last = months.length - 1
    setHover((h) => {
      if (e.key === 'Home') return 0
      if (e.key === 'End') return last
      const from = h ?? (e.key === 'ArrowLeft' ? last + 1 : -1)
      return Math.min(last, Math.max(0, from + (e.key === 'ArrowLeft' ? -1 : 1)))
    })
  }

  return (
    <figure className="chart" data-reveal>
      {/* Below its minimum width the chart scrolls inside the card rather than
          shrinking the axis labels past reading size. */}
      <div className="chart__scroll">
        <div
          className="chart__plot"
          tabIndex={0}
          role="group"
          aria-label={t('Activity')}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          onPointerLeave={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${A.w} ${A.h}`} aria-hidden>
            {/* Horizontal rules at nothing, half and the peak. */}
            {[...new Set([0, Math.round(max / 2), max])].map((value) => (
              <g key={value}>
                <line className="chart__grid" x1={A.left} x2={A.w - A.right} y1={y(value)} y2={y(value)} />
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
                  rx="2"
                  data-on={hover === i}
                  style={{ '--i': i } as React.CSSProperties}
                />
              ) : null,
            )}

            <path className="chart__area" d={area} />
            <polyline className="chart__line" points={line.join(' ')} pathLength={1} />

            {hover !== null && (
              <line className="chart__cross" x1={centre(hover)} x2={centre(hover)} y1={A.top} y2={base} />
            )}

            {/* Only the peak is labelled on the chart; the rest is a hover or
                the table away. */}
            <text className="chart__peak" x={centre(peak)} y={y(months[peak].active) - 8} textAnchor="middle">
              {months[peak].active}
            </text>

            {months.map((m, i) => (
              <circle
                key={m.at}
                className="chart__dot"
                cx={centre(i)}
                cy={y(m.active)}
                r={hover === i ? 4.5 : 3}
                data-on={hover === i}
              />
            ))}

            {months.map((m, i) =>
              i % tick === 0 ? (
                <text key={m.at} className="chart__tick" x={centre(i)} y={A.h - 10} textAnchor="middle">
                  {m.label === 'Jan' || i === 0 ? `${t(m.label)} ${m.year}` : t(m.label)}
                </text>
              ) : null,
            )}

            {/* Hit areas: a full-height column per month, wider than any mark. */}
            {months.map((m, i) => (
              <rect
                key={m.at}
                className="chart__hit"
                x={A.left + step * i}
                y={A.top}
                width={step}
                height={A_PLOT_H}
                onPointerEnter={() => setHover(i)}
              />
            ))}
          </svg>

          {shown && hover !== null && (
            <div
              className="chart__tip"
              role="status"
              data-side={centre(hover) > A.w * 0.7 ? 'left' : 'right'}
              style={{ left: `${(centre(hover) / A.w) * 100}%` }}
            >
              <span className="chart__tip-title">{label(shown)}</span>
              <span className="chart__tip-row">
                <i className="chart__swatch chart__swatch--area" aria-hidden />
                {t('Projects running')}
                <b>{shown.active}</b>
              </span>
              <span className="chart__tip-row">
                <i className="chart__swatch chart__swatch--bar" aria-hidden />
                {t('Started that month')}
                <b>{shown.started}</b>
              </span>
            </div>
          )}
        </div>
      </div>

      <figcaption className="chart__legend">
        <span className="chart__key chart__key--area">{t('Projects running')}</span>
        <span className="chart__key chart__key--bar">{t('Started that month')}</span>
      </figcaption>

      <details className="chart__table">
        <summary>{t('Show as table')}</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">{t('Month')}</th>
              <th scope="col">{t('Projects running')}</th>
              <th scope="col">{t('Started that month')}</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.at}>
                <th scope="row">{label(m)}</th>
                <td>{m.active}</td>
                <td>{m.started}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

/* ── Project timeline ─────────────────────────────────────────────────────── */

const S = { w: 800, label: 168, plot: 176, right: 12, head: 22, row: 20 }
const S_PLOT_W = S.w - S.plot - S.right
/** Names longer than this are cut — the lane, not the label, is the content. */
const S_NAME_MAX = 21
/** A lane counts as current when its last push is this close to the newest one. */
const RECENT_MS = 30 * 86_400_000

/**
 * One lane per repository, from its first commit to its last push, on the same
 * months the activity chart uses. Lanes pushed to within a month of the newest
 * push are in the accent; the rest are quiet. "Recent" is measured against
 * the data, not the clock, so the prerendered page and the browser agree.
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
  const { t, locale } = useI18n()
  const [hover, setHover] = useState<number | null>(null)
  if (spans.length === 0 || months.length === 0) return null

  const [from, to] = activityDomain(months)
  const x = (time: number) => S.plot + ((time - from) / (to - from)) * S_PLOT_W
  const height = S.head + spans.length * S.row + 6
  const tick = months.length <= 13 ? 1 : months.length <= 26 ? 2 : 3
  const newest = Math.max(...spans.map((s) => s.to))
  const recent = (span: ProjectSpan) => newest - span.to <= RECENT_MS
  const date = (time: number) =>
    new Date(time).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  const shown = hover !== null ? spans[hover] : null

  return (
    <figure className="chart chart--lanes" data-reveal>
      <div className="chart__scroll">
        <div className="chart__plot" onPointerLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${S.w} ${height}`} role="group" aria-label={t('Project timeline')}>
            {months.map((m, i) => (
              <g key={m.at}>
                <line className="chart__grid" x1={x(m.at)} x2={x(m.at)} y1={S.head - 8} y2={height - 4} />
                {i % tick === 0 && (
                  <text className="chart__tick" x={x(m.at) + 4} y={S.head - 12}>
                    {m.label === 'Jan' || i === 0 ? `${t(m.label)} ${m.year}` : t(m.label)}
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
              const name = span.title.length > S_NAME_MAX ? `${span.title.slice(0, S_NAME_MAX - 1)}…` : span.title

              return (
                <g
                  key={span.name}
                  className="lane"
                  role="button"
                  tabIndex={0}
                  data-recent={recent(span)}
                  data-on={hover === i}
                  aria-label={`${span.title} — ${span.language ?? '—'}, ${date(span.from)} – ${date(span.to)}`}
                  onClick={() => onOpen(span.name)}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    e.preventDefault()
                    onOpen(span.name)
                  }}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <rect className="lane__hit" x="2" y={top} width={S.w - 4} height={S.row} rx="6" />
                  <text className="lane__name" x={S.label} y={middle + 3.4} textAnchor="end">
                    {name}
                  </text>
                  <rect className="lane__bar" x={start} y={middle - 3} width={width} height="6" rx="3" />
                  <circle className="lane__end" cx={start + width} cy={middle} r="4" />
                </g>
              )
            })}
          </svg>

          {shown && hover !== null && (
            <div
              className="chart__tip"
              role="status"
              data-side={x(shown.to) > S.w * 0.7 ? 'left' : 'right'}
              style={{
                left: `${(x(shown.to) / S.w) * 100}%`,
                top: `${((S.head + hover * S.row + S.row) / height) * 100}%`,
              }}
            >
              <span className="chart__tip-title">{shown.title}</span>
              <span className="chart__tip-row">
                {date(shown.from)} – {date(shown.to)}
                <b>{formatSpan(shown.from, shown.to, locale)}</b>
              </span>
              {shown.language && <span className="chart__tip-row">{shown.language}</span>}
            </div>
          )}
        </div>
      </div>

      <figcaption className="chart__legend">
        <span className="chart__key chart__key--recent">{t('Pushed in the last month')}</span>
        <span className="chart__key chart__key--quiet">{t('Quiet for a while')}</span>
      </figcaption>
    </figure>
  )
}
