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
  privateProject('anon-WebMirror-private', 'anon-WebMirror', 'Privacy-focused website mirroring with fail-closed leak protection. Access is available on request.', ['private-access', 'privacy', 'security']),
]
