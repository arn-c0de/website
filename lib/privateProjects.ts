import { asset } from './basePath'
import type { Project } from './types'

const privateProject = (
  name: string,
  title: string,
  description: string,
  topics: string[],
  extra: Partial<Pick<Project, 'language' | 'page' | 'icon' | 'iconDark'>> = {},
): Project => ({
  name, title, description, topics,
  full_name: 'private project', html_url: '', homepage: null, language: 'Rust',
  stargazers_count: 0, forks_count: 0, fork: false, archived: false,
  pushed_at: '', created_at: '', license: null, category: 'Private research',
  featured: true, links: [], icon: null, status: 'private', isPrivate: true,
  ...extra,
})

export const PRIVATE_PROJECTS: Project[] = [
  privateProject('JobFinder-private', 'JobFinder', 'Self-hosted workspace for jobs, freelance projects and public tenders. Test access and collaboration are available on request.', ['private-access', 'workspace', 'web']),
  privateProject('DeepVision-Web-private', 'DeepVision-Web', 'PCB inspection with a phone in the browser: recognition, placement overlay, stabilized Deep Zoom and automatic optical inspection. Private project, occasional previews only.', ['private-access', 'computer-vision', 'webassembly'], {
    language: 'JavaScript',
    page: '/deepvision/',
    icon: asset('/projects/deepvision/icon-light.svg'),
    iconDark: asset('/projects/deepvision/icon-dark.svg'),
  }),
  privateProject('Agent-Office-private', 'Agent Office', 'Local control plane for a small team of AI coding agents: isolated workspaces, budgets, approvals on the phone and an isometric pixel-art office. Private project; test versions are available on request.', ['private-access', 'agents', 'typescript'], {
    language: 'TypeScript',
    page: '/agent-office/',
  }),
  privateProject('PCB-Trace-private', 'PCB-Trace', 'A private, self-hosted traceability web app for electronics production. Serial numbers and Data Matrix codes are scanned on tablets, and every board can be followed through its own sequence of steps, with photos, defects and repairs. Around it: day and week planning, orders with partial deliveries, statistics, roles with login, an audit log, and operator names that disappear after a retention period. Details on request.', ['private-access', 'traceability', 'web'], {
    language: 'JavaScript',
  }),
  privateProject('anon-WebMirror-private', 'anon-WebMirror', 'Privacy-focused website mirroring with fail-closed leak protection. Access is available on request.', ['private-access', 'privacy', 'security']),
]
