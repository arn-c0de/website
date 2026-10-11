'use client'

import { useI18n } from '@/lib/i18n'
import { SOCIALS } from '@/lib/socials'
import { SocialIcon } from './Icons'

/**
 * Links to the profiles in lib/socials.ts. `pills` shows name and handle,
 * `icons` only the marks (footer). rel="me" lets sites that verify profile
 * links recognise this page as the owner's.
 */
export default function SocialLinks({ variant = 'pills' }: { variant?: 'pills' | 'icons' }) {
  const { t } = useI18n()
  return (
    <ul className={`socials socials--${variant}`}>
      {SOCIALS.map((s) => (
        <li key={s.id}>
          <a
            className="socials__link"
            data-id={s.id}
            href={s.href}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={t('{name}: {handle}', { name: s.name, handle: s.handle })}
            title={variant === 'icons' ? `${s.name} ${s.handle}` : undefined}
          >
            <SocialIcon id={s.id} size={variant === 'icons' ? 15 : 16} />
            {variant === 'pills' && (
              <>
                <span className="socials__name">{s.name}</span>
                <span className="socials__handle">{s.handle}</span>
              </>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
