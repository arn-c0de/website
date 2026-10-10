'use client'

import type { Project } from '@/lib/types'
import { formatRelative } from '@/lib/format'
import { ArrowIcon, ForkIcon, LanguageIcon, StarIcon } from './Icons'

const MAX_TAGS = 3
/** Rough width budget for the single tag row, in characters of the mono
 *  face plus a little per tag for padding and gap. */
const TAG_BUDGET = 30

/** As many topics as fit on one line — never a half-cut word. */
function visibleTopics(topics: string[]) {
  const shown: string[] = []
  let used = 0
  for (const topic of topics.slice(0, MAX_TAGS)) {
    const cost = topic.length + 3
    if (shown.length > 0 && used + cost > TAG_BUDGET) break
    shown.push(topic)
    used += cost
  }
  return shown
}

export default function ProjectCard({
  project,
  onOpen,
  showFeaturedBadge = false,
  index = 0,
}: {
  project: Project
  onOpen: (name: string) => void
  /** Only meaningful when the grid mixes featured and non-featured projects. */
  showFeaturedBadge?: boolean
  /** Position in the grid; drives the staggered entrance animation. */
  index?: number
}) {
  const topics = visibleTopics(project.topics)
  const extra = project.topics.length - topics.length
  const badge = showFeaturedBadge && project.featured

  // A soft light follows the cursor across the card. Written straight to the
  // element's own custom properties, so only the card under the pointer does
  // any work and React never re-renders for it.
  function trackPointer(event: React.PointerEvent<HTMLButtonElement>) {
    const card = event.currentTarget
    const box = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${event.clientX - box.left}px`)
    card.style.setProperty('--my', `${event.clientY - box.top}px`)
  }

  return (
    <button
      type="button"
      className={`card${badge ? ' card--featured' : ''}`}
      style={{ '--i': index } as React.CSSProperties}
      data-reveal
      onPointerMove={trackPointer}
      onClick={() => onOpen(project.name)}
      aria-label={`Open details for ${project.title}`}
    >
      <div className="card__head">
        {project.icon ? (
          <img className="card__icon" src={project.icon} alt="" width={26} height={26} />
        ) : project.language ? (
          <span className="card__icon card__icon--language">
            <LanguageIcon language={project.language} size={18} />
          </span>
        ) : (
          <span className="card__icon card__icon--mono" aria-hidden>
            {project.title.charAt(0)}
          </span>
        )}
        <h3 className="card__title">{project.title}</h3>
        {/* Active is the normal state; only the exceptions earn a badge. */}
        {project.status !== 'active' && (
          <span className={`card__flag card__flag--${project.status}`}>{project.status}</span>
        )}
      </div>

      {/* Kept in the tree even when empty: the reserved two lines are what
          keeps a row of cards from stepping up and down. */}
      <p className="card__desc">{project.description}</p>

      <div className="tagrow tagrow--card">
        {topics.map((topic) => (
          <span key={topic} className="tag">
            {topic}
          </span>
        ))}
        {extra > 0 && <span className="tag tag--more">+{extra}</span>}
      </div>

      <div className="card__foot">
        <span className="card__stat">
          <StarIcon />
          {project.stargazers_count}
        </span>
        {project.forks_count > 0 && (
          <span className="card__stat">
            <ForkIcon />
            {project.forks_count}
          </span>
        )}
        {project.language && <span className="card__stat">{project.language}</span>}
        <span className="card__when">{formatRelative(project.pushed_at)}</span>
        <span className="card__go" aria-hidden>
          <ArrowIcon />
        </span>
      </div>
    </button>
  )
}
