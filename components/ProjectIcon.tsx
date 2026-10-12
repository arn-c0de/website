/**
 * A project's icon. With a dark variant, both are rendered and the stylesheet
 * shows the one that fits the active theme (`.themed-light` / `.themed-dark`).
 */
export default function ProjectIcon({
  src,
  dark,
  className,
  size,
  lazy = false,
}: {
  src: string
  dark?: string
  className: string
  size: number
  /** For icons in lists and grids, most of which start below the fold. */
  lazy?: boolean
}) {
  const load = lazy ? ({ loading: 'lazy', decoding: 'async' } as const) : {}
  if (!dark) return <img className={className} src={src} alt="" width={size} height={size} {...load} />
  return (
    <>
      <img className={`${className} themed-light`} src={src} alt="" width={size} height={size} {...load} />
      <img className={`${className} themed-dark`} src={dark} alt="" width={size} height={size} {...load} />
    </>
  )
}
