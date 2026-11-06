'use client'

import type { ReactNode } from 'react'
import { useCountUp } from '@/lib/useMotion'

/**
 * One cell of the metric strip. Numbers count up; anything else (the relative
 * "last push") is text and simply appears.
 */
export default function Metric({ value, label }: { value: number | ReactNode; label: string }) {
  const isNumber = typeof value === 'number'

  return (
    <div className="metric">
      {isNumber ? <Counter value={value} /> : <div className="metric__v metric__v--text">{value}</div>}
      <div className="metric__k">{label}</div>
    </div>
  )
}

/** Split out so the hook only ever runs for the numeric case. */
function Counter({ value }: { value: number }) {
  return (
    <div className="metric__v" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {useCountUp(value)}
    </div>
  )
}
