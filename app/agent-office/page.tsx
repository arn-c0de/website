import { AgentOfficeRoute, agentOfficeMetadata } from '@/lib/routes/agentOffice'

export const metadata = agentOfficeMetadata('en')

export default function Page() {
  return <AgentOfficeRoute locale="en" />
}
