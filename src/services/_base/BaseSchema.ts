// Path: /src/services/_base/BaseSchema.ts
// Module: Base Service Shared Types
// Depends on: none
// Description: Shared service schema types used across service implementations.

export interface ServiceListItem {
  id: string
  uid: string
  serviceType: string
  name: string
  email?: string
  status: 'active' | 'invalid' | 'pending' | 'error'
  shardId: string
  createdAt: string
  updatedAt: string
}

export interface ServiceSaveInput<TConfig, TCred> {
  name: string
  config: TConfig
  credentials: TCred
}

export interface ServiceSaveResult {
  id: string
  shardId: string
}
