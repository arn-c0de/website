import { SITE_URL } from '@/lib/basePath'

export const dynamic = 'force-static'

/**
 * RFC 9116: where to report a vulnerability, and with which key. The file
 * must name an expiry under a year away; it is computed at build time, and
 * the deploy rebuilds daily, so it never actually runs out.
 */
const VALID_DAYS = 180

export function GET() {
  const expires = new Date(Date.now() + VALID_DAYS * 86_400_000).toISOString().replace(/\.\d{3}Z$/, 'Z')
  const body = [
    'Contact: mailto:arn-c0de@protonmail.com',
    `Expires: ${expires}`,
    `Encryption: ${SITE_URL}/arn-c0de.asc`,
    'Preferred-Languages: en, de',
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/?tab=contact`,
    '',
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
