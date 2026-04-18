// Path: /src/services/google-creds/GoogleCredsApi.ts
// Module: GoogleCredsApi
// Depends on: axios, crypto
// Description: Lightweight Google API helpers for validation and project listing.

import { createSign } from 'crypto'
import axios from 'axios'
import type { GCPProject } from './types'

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url')
}

export class GoogleCredsApi {
  /** Lists projects using a service account. */
  async listProjects(serviceAccountJson: string): Promise<GCPProject[]> {
    const token = await this.getServiceAccountToken(serviceAccountJson)
    const response = await axios({
      url: 'https://cloudresourcemanager.googleapis.com/v1/projects',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30_000,
    })
    return (response.data?.projects ?? []) as GCPProject[]
  }

  /** Validates an OAuth app credential shape. */
  async validateOAuthApp(clientId: string, clientSecret: string): Promise<boolean> {
    return Boolean(clientId && clientSecret && clientId.includes('.apps.googleusercontent.com'))
  }

  /** Validates an API key with a simple Google discovery call. */
  async validateApiKey(key: string): Promise<boolean> {
    try {
      await axios({
        url: `https://www.googleapis.com/discovery/v1/apis?key=${key}`,
        method: 'GET',
        timeout: 15_000,
      })
      return true
    } catch {
      return false
    }
  }

  /** Exchanges a service-account JWT for an OAuth access token. */
  private async getServiceAccountToken(jsonKey: string): Promise<string> {
    const parsed = JSON.parse(jsonKey) as { client_email: string; private_key: string; token_uri?: string }
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT' }
    const claimSet = {
      iss: parsed.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform.read-only',
      aud: parsed.token_uri ?? 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }

    const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claimSet))}`
    const signer = createSign('RSA-SHA256')
    signer.update(unsigned)
    signer.end()
    const signature = signer.sign(parsed.private_key).toString('base64url')
    const assertion = `${unsigned}.${signature}`

    const response = await axios({
      url: parsed.token_uri ?? 'https://oauth2.googleapis.com/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }).toString(),
      timeout: 30_000,
    })

    return response.data.access_token as string
  }
}
