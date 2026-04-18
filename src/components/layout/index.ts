// Path: /src/components/layout/index.ts
// Module: Layout Component Types
// Depends on: @/services/_registry/serviceMeta
// Description: Shared layout component prop types.

import type { ServiceMeta } from '@/services/_registry/serviceMeta'

export interface AppShellProps {
  children: React.ReactNode
}

export interface SidebarProps {
  services: ServiceMeta[]
  currentPath: string
  isCollapsed?: boolean
  onToggle?: () => void
}

export interface HeaderProps {
  user: {
    displayName?: string
    email: string
    avatarUrl?: string
  }
  breadcrumb?: Array<{ label: string; href?: string }>
  onToggleSidebar?: () => void
}

export interface UserMenuProps {
  user: HeaderProps['user']
}

export interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}
