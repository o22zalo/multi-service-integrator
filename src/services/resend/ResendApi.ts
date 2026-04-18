// Path: /src/services/resend/ResendApi.ts
// Module: ResendApi
// Depends on: axios
// Description: Resend API adapter.

import axios, { AxiosError } from 'axios'
import type { CreateApiKeyInput, ResendApiKey, ResendDomain } from './types'

export class ResendApi {
  private readonly baseUrl = 'https://api.resend.com'

  constructor(private readonly apiKey: string) {}

  /** Lists verified and pending domains. */
  async listDomains(): Promise<ResendDomain[]> {
    const data = await this.request<{ data: ResendDomain[] }>('/domains')
    return data.data
  }

  /** Requests verification for a domain. */
  async verifyDomain(domainId: string): Promise<void> {
    await this.request(`/domains/${domainId}/verify`, { method: 'POST' })
  }

  /** Deletes a domain. */
  async deleteDomain(domainId: string): Promise<void> {
    await this.request(`/domains/${domainId}`, { method: 'DELETE' })
  }

  /** Lists API keys. */
  async listApiKeys(): Promise<ResendApiKey[]> {
    const data = await this.request<{ data: ResendApiKey[] }>('/api-keys')
    return data.data
  }

  /** Creates an API key. */
  async createApiKey(input: CreateApiKeyInput): Promise<{ id: string; token: string }> {
    return this.request<{ id: string; token: string }>('/api-keys', { method: 'POST', body: input })
  }

  /** Deletes an API key. */
  async deleteApiKey(apiKeyId: string): Promise<void> {
    await this.request(`/api-keys/${apiKeyId}`, { method: 'DELETE' })
  }

  /** Reads account identity details. */
  async getMe(): Promise<{ id: string; email: string; display_name: string }> {
    return this.request<{ id: string; email: string; display_name: string }>('/me')
  }

  /** Performs a Resend API request with error mapping. */
  private async request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    try {
      const response = await axios({
        url: `${this.baseUrl}${path}`,
        method: options.method ?? 'GET',
        data: options.body,
        timeout: 30_000,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      return response.data as T
    } catch (error) {
      const axiosError = error as AxiosError
      const status = axiosError.response?.status ?? 500
      throw {
        code: status === 401 ? 'RS-AUTH-001' : 'RS-API-001',
        message: axiosError.message,
        statusCode: status,
      }
    }
  }
}
