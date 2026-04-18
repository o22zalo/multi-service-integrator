// Path: /src/services/supabase/SupabaseApi.ts
// Module: SupabaseApi
// Depends on: axios
// Description: Supabase REST and management API adapter.

import axios from 'axios'
import type { SupabaseCredential, SupabaseConfig, SupabaseEdgeFunction, SupabaseProject, SupabaseTable } from './types'

export class SupabaseApi {
  constructor(private readonly credential: SupabaseCredential, private readonly config: Partial<SupabaseConfig>) {}

  /** Pings the Supabase REST endpoint. */
  async ping(): Promise<boolean> {
    if (!this.config.project_url) return false
    try {
      await axios({
        url: `${this.config.project_url}/rest/v1/`,
        method: 'GET',
        timeout: 15_000,
        headers: {
          apikey: this.credential.service_role_key,
          Authorization: `Bearer ${this.credential.service_role_key}`,
        },
      })
      return true
    } catch {
      return false
    }
  }

  /** Lists projects using the management API. */
  async listProjects(): Promise<SupabaseProject[]> {
    return this.managementRequest<SupabaseProject[]>('/projects')
  }

  /** Returns a single project from the management API. */
  async getProjectDetails(ref: string): Promise<SupabaseProject> {
    return this.managementRequest<SupabaseProject>(`/projects/${ref}`)
  }

  /** Lists tables by reading the OpenAPI description. */
  async listTables(projectUrl: string, serviceRoleKey: string): Promise<SupabaseTable[]> {
    const response = await axios({
      url: `${projectUrl}/rest/v1/`,
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/openapi+json',
      },
      timeout: 20_000,
    })

    const paths = response.data?.paths ?? {}
    const tables = Object.keys(paths)
      .filter((path: string) => path !== '/')
      .map((path: string) => ({
        name: path.replace(/^\//, ''),
        schema: 'public',
        columns: [],
      }))

    return tables
  }

  /** Lists edge functions using the management API. */
  async listEdgeFunctions(projectRef: string): Promise<SupabaseEdgeFunction[]> {
    return this.managementRequest<SupabaseEdgeFunction[]>(`/projects/${projectRef}/functions`)
  }

  /** Calls the Supabase management API. */
  private async managementRequest<T>(path: string, method = 'GET'): Promise<T> {
    if (!this.credential.access_token) {
      throw {
        code: 'SB-MGMT-001',
        message: 'Management token required',
      }
    }

    const response = await axios({
      url: `https://api.supabase.com/v1${path}`,
      method,
      timeout: 30_000,
      headers: {
        Authorization: `Bearer ${this.credential.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    return response.data as T
  }
}
