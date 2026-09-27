import type { Project } from './types'

const privateProject = (name: string, title: string, description: string, topics: string[]): Project => ({
  name, title, description, topics,
  full_name: 'private project', html_url: '', homepage: null, language: 'Rust',
  stargazers_count: 0, forks_count: 0, fork: false, archived: false,
  pushed_at: '', created_at: '', license: null, category: 'Private research',
  featured: true, links: [], icon: null, status: 'private', isPrivate: true,
})

export const PRIVATE_PROJECTS: Project[] = [
  privateProject('QuestLink-Linux', 'QuestLink Linux', 'Phase 1 of an independent Rust VR simulation world for shared PC and VR multiplayer sessions. Early tester access is available on request.', ['pcvr', 'quest-3', 'rust', 'multiplayer']),
  privateProject('JobFinder-private', 'JobFinder', 'Self-hosted workspace for jobs, freelance projects and public tenders. Test access and collaboration are available on request.', ['private-access', 'workspace', 'web']),
  privateProject('anon-WebMirror-private', 'anon-WebMirror', 'Privacy-focused website mirroring with fail-closed leak protection. Access is available on request.', ['private-access', 'privacy', 'security']),
]
