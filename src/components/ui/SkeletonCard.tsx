// Path: /src/components/ui/SkeletonCard.tsx
// Module: SkeletonCard
// Depends on: ./index
// Description: Reusable skeleton placeholder card.

import type { SkeletonCardProps } from './index'

/** Renders an animated skeleton placeholder. */
export function SkeletonCard({ lines = 3, hasAvatar = false, className = '' }: SkeletonCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900 p-4 animate-pulse ${className}`}>
      <div className="flex gap-3">
        {hasAvatar && <div className="h-12 w-12 rounded-full bg-slate-800" />}
        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className="h-3 rounded-full bg-slate-800"
              style={{ width: `${100 - index * 12}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
