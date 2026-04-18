// Path: /src/components/services/_shared/index.ts
// Module: Shared Service UI Types
// Depends on: @/types/service, @/services/_registry/serviceForms
// Description: Shared prop types for generic service UI components.

import type { ServiceListItem, SubResourceDef } from '@/types/service'
import type { DynamicFormField } from '@/services/_registry/serviceForms'

export interface AccountListProps {
  serviceType: string
  uid: string
}

export interface AccountCardProps {
  item: ServiceListItem
  isSelected?: boolean
  onSelect?: (id: string) => void
  onDelete: (id: string) => void
}

export interface AddAccountModalProps {
  serviceType: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (id: string) => void
}

export interface SubResourcePanelProps {
  serviceType: string
  accountId: string
  uid: string
  subResourceType: SubResourceDef
}

export type { DynamicFormField }
