/**
 * The site is published from the project repo `website`, so GitHub Pages
 * serves it under https://arn-c0de.github.io/website/ rather than at a
 * domain root. Every asset, link and service-worker scope has to carry that
 * prefix.
 *
 * Override with PAGES_BASE_PATH when that changes:
 *   PAGES_BASE_PATH=""            custom domain, or the arn-c0de.github.io repo
 *   PAGES_BASE_PATH="/other-name" a differently named project repo
 */
const basePath = process.env.PAGES_BASE_PATH ?? '/website'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the whole app ships as plain files to GitHub Pages.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // TypeScript 5.9's CLI can terminate without writing --showConfig when
  // launched by Node 24. Next's API checker is compatible here and keeps the
  // production build independent of that process-level behaviour.
  experimental: { useTypeScriptCli: false },

  basePath,
  // Exposed to the client so raw href/src strings can be prefixed too —
  // `basePath` only rewrites what Next itself generates.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
}

export default nextConfig
