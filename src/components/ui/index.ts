// Path: /src/components/ui/index.ts
// Module: UI Shared Types
// Depends on: none
// Description: Shared prop types for lightweight UI building blocks.

export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, info: React.ErrorInfo) => void
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export interface SkeletonCardProps {
  lines?: number
  hasAvatar?: boolean
  className?: string
}

export interface EmptyStateProps {
  title: string
  description: string
  icon?: string
  action?: {
    label: string
    onClick: () => void
  }
}
