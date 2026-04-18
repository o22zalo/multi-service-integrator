// Path: /src/components/services/_shared/VirtualList.tsx
// Module: VirtualList
// Depends on: react
// Description: Minimal fixed-height virtualized list.

'use client'

import { useMemo, useState } from 'react'

/** Renders a virtualized fixed-height list. */
export function VirtualList<T>({ items, renderItem, itemHeight }: { items: T[]; renderItem: (item: T, index: number) => React.ReactNode; itemHeight: number }) {
  const [scrollTop, setScrollTop] = useState(0)
  const viewportHeight = 480
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 4)
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + 4)
  const visibleItems = useMemo(() => items.slice(startIndex, endIndex), [endIndex, items, startIndex])

  return (
    <div className="overflow-auto rounded-2xl border border-slate-800" style={{ height: viewportHeight }} onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}>
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, index) => renderItem(item, startIndex + index))}
        </div>
      </div>
    </div>
  )
}
