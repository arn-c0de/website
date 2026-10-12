import { QLinkRoute, qlinkMetadata } from '@/lib/routes/qlink'

export const metadata = qlinkMetadata('en')

export default function Page() {
  return <QLinkRoute locale="en" />
}
