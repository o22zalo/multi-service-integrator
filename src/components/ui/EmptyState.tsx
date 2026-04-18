// Path: /src/components/ui/EmptyState.tsx
// Module: EmptyState
// Depends on: @/lib/utils/icons, ./index
// Description: Empty-state component with optional CTA.

import { getLucideIcon } from '@/lib/utils/icons'
import type { EmptyStateProps } from './index'

/** Renders an empty state block. */
export function EmptyState({ title, description, icon = 'box', action }: EmptyStateProps) {
  const Icon = getLucideIcon(icon)

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900 px-6 py-16 text-center">
      <div className="rounded-2xl bg-slate-950 p-4 text-sky-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      {action && (
        <button type="button" onClick={action.onClick} className="mt-6 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400">
          {action.label}
        </button>
      )}
    </div>
  )
}
