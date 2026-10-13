import { AgentOfficeRoute, agentOfficeMetadata } from '@/lib/routes/agentOffice'

export const metadata = agentOfficeMetadata('de')

export default function Page() {
  return <AgentOfficeRoute locale="de" />
}
