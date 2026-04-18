// Path: /src/components/ui/ErrorBoundary.tsx
// Module: ErrorBoundary
// Depends on: react, ./index
// Description: Class-based React error boundary.

'use client'

import { Component } from 'react'
import type { ErrorBoundaryProps, ErrorBoundaryState } from './index'

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info)
    if (process.env.NODE_ENV !== 'production') {
      console.error(error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-sm text-rose-300">Unexpected UI error</p>
            <p className="mt-2 text-sm text-slate-400">{this.state.error?.message ?? 'Unknown error'}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
            >
              Retry
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
