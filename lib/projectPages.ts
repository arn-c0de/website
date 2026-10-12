import { asset } from './basePath'
import type { Locale } from './i18n'
import { localePath } from './localePath'
import { snapshotProjects } from './github'
import type { Project } from './types'

/**
 * Every public project gets its own page at /projects/<slug>/, prerendered
 * from the committed snapshot. The slug comes from the display title, so
 * QLink-preview lives at /projects/qlink/ rather than under its repo name.
 */
export function projectSlug(project: Pick<Project, 'title'>): string {
  return project.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Private projects have no repository to show, so they stay panel-only. */
export function hasPage(project: Pick<Project, 'isPrivate'>): boolean {
  return !project.isPrivate
}

/** True when the project can be linked to: its project page, or a page of its own. */
export function hasLinkablePage(project: Pick<Project, 'isPrivate' | 'page'>): boolean {
  return hasPage(project) || Boolean(project.page)
}

/** Site-relative address of a project's page, base path included. */
export function projectHref(project: Pick<Project, 'title' | 'page'>, locale: Locale = 'en'): string {
  return asset(localePath(project.page ?? `/projects/${projectSlug(project)}/`, locale))
}

/** The projects that get a page, in the site's own order. */
export function pageProjects(): Project[] {
  return snapshotProjects().filter(hasPage)
}

/** Up to `count` other projects from the same category, most starred first. */
export function relatedProjects(project: Project, all: readonly Project[], count = 3): Project[] {
  return all
    .filter((p) => p.name !== project.name && hasPage(p) && p.category === project.category)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, count)
}
