'use client'

import { useEffect, useState } from 'react'
import { loadReadme } from '@/lib/github'
import { useI18n } from '@/lib/i18n'
import type { Project } from '@/lib/types'

/**
 * GitHub already sanitises the HTML it renders, but this runs it through the
 * browser's parser once more and drops anything executable before it is
 * inserted. Cheap, and it means a compromised upstream response cannot run.
 *
 * Images are also defused: readmes embed badges and screenshots hosted on
 * githubusercontent.com, and loading those automatically would contact a third
 * party the visitor never asked about. The URL is parked in `data-src` and only
 * becomes a real request when the visitor asks for it.
 */
function sanitise(html: string, repo: string): { withImages: string; withoutImages: string; images: number } {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed, form, link, meta').forEach((el) =>
    el.remove(),
  )
  // GitHub injects a permalink anchor into every heading; it renders as a
  // stray link glyph outside of GitHub's own stylesheet.
  doc.querySelectorAll('a.anchor, svg.octicon-link').forEach((el) => el.remove())

  // Readmes reference sibling files by relative path. GitHub leaves those
  // alone, so they would resolve against this domain and 404.
  const RAW = `https://raw.githubusercontent.com/arn-c0de/${repo}/HEAD/`
  const BLOB = `https://github.com/arn-c0de/${repo}/blob/HEAD/`
  const isAbsolute = (url: string) => /^(https?:|data:|mailto:|#)/i.test(url)

  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      if (name === 'href' || name === 'src') {
        // Browsers strip whitespace and control characters out of a scheme
        // before acting on it, so `java\tscript:` runs just like `javascript:`.
        // Collapse those out before checking, and block every scheme that can
        // execute or smuggle markup — not just `javascript:`.
        const scheme = attr.value.replace(/[\u0000- ]+/g, '').toLowerCase()
        if (/^(javascript|vbscript|data):/.test(scheme)) el.removeAttribute(attr.name)
      }
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href')
      if (href && !isAbsolute(href)) el.setAttribute('href', BLOB + href.replace(/^\.?\//, ''))
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src')
      if (src && !isAbsolute(src)) el.setAttribute('src', RAW + src.replace(/^\.?\//, ''))
      el.removeAttribute('srcset')
      el.setAttribute('loading', 'lazy')
    }
  })

  const images = doc.querySelectorAll('img')
  const withImages = doc.body.innerHTML

  // Second pass: park every image URL so nothing is requested until asked for.
  images.forEach((img) => {
    img.setAttribute('data-src', img.getAttribute('src') ?? '')
    img.removeAttribute('src')
  })

  return { withImages, withoutImages: doc.body.innerHTML, images: images.length }
}

/**
 * A repository's readme, fetched from the GitHub API when it mounts. Used by
 * the detail panel and by the project pages; key it by repo name so stepping
 * to another project starts from a clean state.
 */
export default function Readme({ project }: { project: Project }) {
  const { t } = useI18n()
  const [readme, setReadme] = useState<{ withImages: string; withoutImages: string; images: number } | null>(null)
  const [readmeState, setReadmeState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [imagesShown, setImagesShown] = useState(false)

  useEffect(() => {
    if (project.isPrivate) {
      setReadmeState('missing')
      setReadme(null)
      return
    }
    const controller = new AbortController()
    setReadmeState('loading')
    setReadme(null)
    setImagesShown(false)
    loadReadme(project.name, controller.signal).then((html) => {
      if (controller.signal.aborted) return
      if (html) {
        setReadme(sanitise(html, project.name))
        setReadmeState('ready')
      } else {
        setReadmeState('missing')
      }
    })
    return () => controller.abort()
  }, [project.name])

  return (
    <>
      {readmeState === 'loading' && (
        <div className="skeleton" style={{ height: 160 }} aria-label={t('Loading readme')} />
      )}
      {readmeState === 'missing' && (
        <p style={{ color: 'var(--text-faint)', fontSize: 13.5, margin: 0 }}>
          {project.isPrivate
            ? t('PANEL_PRIVATE')
            : t('Readme could not be loaded — open the repository on GitHub instead.')}
        </p>
      )}
      {readmeState === 'ready' && readme && (
        <>
          {readme.images > 0 && !imagesShown && (
            <div className="callout" style={{ marginBottom: 14 }}>
              {t('This readme embeds')}{' '}
              <strong>
                {t(readme.images === 1 ? '{n} image' : '{n} images', { n: readme.images })}
              </strong>{' '}
              {t('README_IMAGES')}
              <div style={{ marginTop: 10 }}>
                <button type="button" className="btn" onClick={() => setImagesShown(true)}>
                  {t('Load images')}
                </button>
              </div>
            </div>
          )}
          <div
            className={`readme${imagesShown ? '' : ' readme--noimg'}`}
            dangerouslySetInnerHTML={{
              __html: imagesShown ? readme.withImages : readme.withoutImages,
            }}
          />
        </>
      )}
    </>
  )
}
