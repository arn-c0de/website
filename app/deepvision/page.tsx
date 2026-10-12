import { DeepVisionRoute, deepvisionMetadata } from '@/lib/routes/deepvision'

export const metadata = deepvisionMetadata('en')

export default function Page() {
  return <DeepVisionRoute locale="en" />
}
