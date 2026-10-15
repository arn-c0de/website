import { pick } from '@/lib/timeline'
import type { Locale } from '@/lib/i18n'
import type { TimelineTable } from '@/timeline.config'

/** A cell that is only figures (and their signs) lines up to the right. */
const NUMERIC = /^[\d.,\s%→+−–-]+$/

/**
 * A table from the timeline config: a caption, column headings, the first
 * cell of each row as its heading, figures aligned right. It sits in a frame
 * that scrolls sideways, so a wide table never pushes the page wider on a
 * phone.
 */
export default function DataTable({ table, locale }: { table: TimelineTable; locale: Locale }) {
  const caption = pick(table.caption, locale)
  const note = pick(table.note, locale)
  return (
    <figure className="dtable">
      <div className="dtable__scroll" tabIndex={0} role="region" aria-label={caption || undefined}>
        <table className="dtable__table">
          {caption && <caption className="dtable__caption">{caption}</caption>}
          <thead>
            <tr>
              {table.columns.map((col, i) => (
                <th key={i} scope="col" className={i > 0 ? 'dtable__num' : undefined}>
                  {pick(col, locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => {
                  const text = pick(cell, locale)
                  if (c === 0) {
                    return (
                      <th key={c} scope="row">
                        {text}
                      </th>
                    )
                  }
                  return (
                    <td key={c} className={NUMERIC.test(text) ? 'dtable__num' : undefined}>
                      {text}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <figcaption className="dtable__note">{note}</figcaption>}
    </figure>
  )
}
