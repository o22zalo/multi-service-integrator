// Path: /src/lib/utils/icons.ts
// Module: LucideIconResolver
// Depends on: lucide-react
// Description: Resolves a string icon name to a lucide-react component.

import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'

function toPascalCase(name: string) {
  return name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/** Resolves a lucide icon from a kebab-case or PascalCase name. */
export function getLucideIcon(name: string): ComponentType<LucideProps> {
  const key = name in LucideIcons ? name : toPascalCase(name)
  return ((LucideIcons as unknown as Record<string, ComponentType<LucideProps>>)[key] ?? LucideIcons.Box)
}
