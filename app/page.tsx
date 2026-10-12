import { HomeRoute, homeMetadata } from '@/lib/routes/home'

export const metadata = homeMetadata('en')

export default function Page() {
  return <HomeRoute locale="en" />
}
