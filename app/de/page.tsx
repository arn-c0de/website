import { HomeRoute, homeMetadata } from '@/lib/routes/home'

export const metadata = homeMetadata('de')

export default function Page() {
  return <HomeRoute locale="de" />
}
