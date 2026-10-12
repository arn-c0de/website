import { DeepVisionRoute, deepvisionMetadata } from '@/lib/routes/deepvision'

export const metadata = deepvisionMetadata('de')

export default function Page() {
  return <DeepVisionRoute locale="de" />
}
