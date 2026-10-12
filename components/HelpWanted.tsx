'use client'

import { useI18n, type Locale } from '@/lib/i18n'
import { pick } from '@/lib/timeline'
import type { TimelineEntry } from '@/timeline.config'
import { ArrowIcon, HandIcon } from './Icons'

/**
 * The "help wanted" box: the areas an entry is looking for help with and a
 * button to where offers land. Its own file so the overview can show it
 * without pulling in the whole timeline tab.
 */
export default function HelpWanted({ help, locale }: { help: NonNullable<TimelineEntry['help']>; locale: Locale }) {
  const { t } = useI18n()
  return (
    <div className="help">
      <span className="help__label">
        <HandIcon />
        {t('Help wanted')}
      </span>
      <span className="help__areas">
        {help.areas.map((area) => (
          <span key={pick(area, 'en')} className="help__area">
            {pick(area, locale)}
          </span>
        ))}
      </span>
      <a className="help__cta" href={help.href} target="_blank" rel="noopener noreferrer">
        {t('Help out')}
        <ArrowIcon />
      </a>
    </div>
  )
}
