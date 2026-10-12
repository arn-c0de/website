/**
 * A project's icon. With a dark variant, both are rendered and the stylesheet
 * shows the one that fits the active theme (`.themed-light` / `.themed-dark`).
 */
export default function ProjectIcon({
  src,
  dark,
  className,
  size,
}: {
  src: string
  dark?: string
  className: string
  size: number
}) {
  if (!dark) return <img className={className} src={src} alt="" width={size} height={size} />
  return (
    <>
      <img className={`${className} themed-light`} src={src} alt="" width={size} height={size} />
      <img className={`${className} themed-dark`} src={dark} alt="" width={size} height={size} />
    </>
  )
}
