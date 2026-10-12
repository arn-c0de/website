import { QLinkRoute, qlinkMetadata } from '@/lib/routes/qlink'

export const metadata = qlinkMetadata('de')

export default function Page() {
  return <QLinkRoute locale="de" />
}
