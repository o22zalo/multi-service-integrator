// Path: /src/app/(dashboard)/services/[type]/page.tsx
// Module: ServicePage
// Depends on: next/navigation, @/components/services/_shared/AccountList, @/services/_registry/serviceMeta, @/lib/auth/auth
// Description: Lists service accounts for a service type.

import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { AccountList } from '@/components/services/_shared/AccountList'
import { getServiceMeta } from '@/services/_registry/serviceMeta'

export default async function ServicePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const meta = getServiceMeta(type)
  const session = await auth()

  if (!meta || !session?.user?.uid) notFound()
  const resolvedMeta = meta

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-sky-400">{resolvedMeta.label}</p>
        <h1 className="text-3xl font-semibold text-white">{resolvedMeta.description}</h1>
      </div>
      <AccountList serviceType={type} uid={session.user.uid} />
    </div>
  )
}
