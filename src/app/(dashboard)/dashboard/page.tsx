// Path: /src/app/(dashboard)/dashboard/page.tsx
// Module: DashboardLandingPage
// Depends on: @/services/_registry/serviceMeta
// Description: Protected dashboard landing page.

import { SERVICE_META } from '@/services/_registry/serviceMeta'

export default function DashboardLandingPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">Overview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Centralized service management with backend parity</h1>
        <p className="mt-4 max-w-3xl text-slate-400">
          This dashboard is designed around the project rules: every UI flow has a matching backend API, sensitive fields are encrypted, audit logs are captured, and the data model is safe for multi-instance deployment.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {SERVICE_META.map((service) => (
          <a key={service.type} href={`/dashboard/services/${service.type}`} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-sky-500/40 hover:bg-slate-900/80">
            <h2 className="text-lg font-semibold text-white">{service.label}</h2>
            <p className="mt-2 text-sm text-slate-400">{service.description}</p>
          </a>
        ))}
      </section>
    </div>
  )
}
