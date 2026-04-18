// Path: /src/services/github/GithubService.ts
// Module: GithubService
// Depends on: ../_base/BaseService, ./GithubApi, ../_registry/ServiceRegistry
// Description: GitHub business logic implementation.

import { BaseService } from '../_base/BaseService'
import { GithubApi } from './GithubApi'
import { ServiceRegistry } from '../_registry/ServiceRegistry'
import type { SubResourceDef } from '@/types/service'
import type {
  GithubConfig,
  GithubCredential,
  GithubHook,
  GithubRepo,
  GithubRepoSecret,
  GithubWorkflow,
  GithubWorkflowLog,
  GithubWorkflowRun,
} from './types'

export class GithubService extends BaseService<
  GithubConfig,
  GithubCredential,
  GithubRepo | GithubWorkflow | GithubHook | GithubWorkflowRun | GithubRepoSecret | GithubWorkflowLog
> {
  readonly SERVICE_TYPE = 'github' as const
  readonly SERVICE_LABEL = 'GitHub'
  readonly CREDENTIAL_FIELDS = ['token', 'webhook_secret']
  readonly ICON = 'github'
  readonly DESCRIPTION = 'Manage GitHub accounts, repositories, workflows, workflow runs, logs, webhooks, and actions secrets'

  /** Validates a GitHub token by fetching the current user. */
  async validateCredentials(creds: GithubCredential): Promise<boolean> {
    try {
      await new GithubApi(creds.token).getUser()
      return true
    } catch {
      return false
    }
  }

  /** Fetches GitHub account metadata from the API. */
  async fetchMetadata(creds: GithubCredential): Promise<Partial<GithubConfig>> {
    const user = await new GithubApi(creds.token).getUser()
    const plan = (user.plan?.name?.toLowerCase() ?? 'free') as GithubConfig['plan']
    const currentConfig = (this as unknown as { currentConfig?: Partial<GithubConfig> }).currentConfig
    return {
      owner: user.login,
      account_email: currentConfig?.account_email ?? creds.email ?? user.email ?? undefined,
      avatar_url: user.avatar_url,
      html_url: user.html_url,
      plan: ['free', 'pro', 'team', 'enterprise'].includes(plan) ? plan : 'free',
      public_repos: user.public_repos,
      private_repos: user.total_private_repos ?? 0,
      followers: user.followers,
      following: user.following,
    }
  }

  /** Returns supported GitHub sub-resource types. */
  getSubResourceTypes(): SubResourceDef[] {
    return [
      {
        type: 'repos',
        label: 'Repositories',
        icon: 'folder-git-2',
        canCreate: false,
        canDelete: false,
        description: 'List repositories available to this account.',
      },
      {
        type: 'workflows',
        label: 'Workflows',
        icon: 'play-circle',
        canCreate: true,
        canDelete: false,
        requiresInput: ['repo_name'],
        createFields: ['repo_name', 'workflow_id', 'ref'],
        createActionLabel: 'Run workflow',
        description: 'List workflow YAML files by repository and trigger a workflow dispatch.',
      },
      {
        type: 'workflow-runs',
        label: 'Workflow Runs',
        icon: 'activity',
        canCreate: false,
        canDelete: true,
        requiresInput: ['repo_name', 'workflow_id'],
        deleteActionLabel: 'Stop run',
        description: 'List recent runs for a workflow and stop in-progress runs.',
      },
      {
        type: 'workflow-logs',
        label: 'Workflow Logs',
        icon: 'file-text',
        canCreate: false,
        canDelete: false,
        requiresInput: ['repo_name', 'run_id'],
        description: 'Fetch and preview workflow run logs by run ID.',
      },
      {
        type: 'webhooks',
        label: 'Webhooks',
        icon: 'webhook',
        canCreate: true,
        canDelete: true,
        requiresInput: ['repo_name'],
        createFields: ['repo_name', 'url', 'events', 'secret'],
        createActionLabel: 'Create webhook',
        deleteActionLabel: 'Delete webhook',
        description: 'Create and delete repository webhooks.',
      },
      {
        type: 'secrets',
        label: 'Actions Secrets',
        icon: 'key-round',
        canCreate: true,
        canDelete: true,
        requiresInput: ['repo_name'],
        createFields: ['repo_name', 'secret_name', 'secret_value'],
        createActionLabel: 'Save secret',
        deleteActionLabel: 'Delete secret',
        description: 'List names of GitHub Actions secrets and create or update them.',
      },
    ]
  }

  /** Fetches GitHub sub-resources using optional query params. */
  async fetchSubResources(type: string, accountId: string, uid: string, params: Record<string, string> = {}) {
    const { config, credentials } = await this.load(uid, accountId)
    const api = new GithubApi(credentials.token)
    const owner = String(config.owner)

    switch (type) {
      case 'repos': {
        const repos = await api.listAllRepos()
        await this.saveSubResources(uid, accountId, type, repos as unknown as Record<string, unknown>[])
        return repos
      }
      case 'workflows': {
        if (!params.repo_name) return []
        const workflows = await api.listWorkflows(owner, params.repo_name)
        await this.saveSubResources(uid, accountId, `${type}_${params.repo_name}`, workflows as unknown as Record<string, unknown>[])
        return workflows
      }
      case 'workflow-runs': {
        if (!params.repo_name) return []
        const workflowId = params.workflow_id ? Number(params.workflow_id) : undefined
        const runs = await api.listWorkflowRuns(owner, params.repo_name, workflowId)
        await this.saveSubResources(uid, accountId, `${type}_${params.repo_name}_${workflowId ?? 'all'}`, runs as unknown as Record<string, unknown>[])
        return runs
      }
      case 'workflow-logs': {
        if (!params.repo_name || !params.run_id) return []
        const logs = await api.getWorkflowRunLogs(owner, params.repo_name, Number(params.run_id))
        await this.saveSubResources(uid, accountId, `${type}_${params.repo_name}_${params.run_id}`, [logs as unknown as Record<string, unknown>])
        return [logs]
      }
      case 'webhooks': {
        if (!params.repo_name) return []
        const hooks = await api.listHooks(owner, params.repo_name)
        await this.saveSubResources(uid, accountId, `${type}_${params.repo_name}`, hooks as unknown as Record<string, unknown>[])
        return hooks
      }
      case 'secrets': {
        if (!params.repo_name) return []
        const secrets = await api.listRepoSecrets(owner, params.repo_name)
        await this.saveSubResources(uid, accountId, `${type}_${params.repo_name}`, secrets as unknown as Record<string, unknown>[])
        return secrets
      }
      default:
        return []
    }
  }

  /** Creates GitHub webhooks, workflow dispatches, and repository secrets. */
  async createSubResource(type: string, accountId: string, uid: string, data: Record<string, unknown>) {
    const { config, credentials } = await this.load(uid, accountId)
    const api = new GithubApi(credentials.token)
    const owner = String(config.owner)

    if (type === 'workflows') {
      const missing = ['repo_name', 'workflow_id'].filter((field) => !data[field])
      if (missing.length > 0) return { missing_fields: missing, defaults: { ref: 'main' } }
      const ref = typeof data.ref === 'string' && data.ref.trim() ? data.ref : 'main'
      await api.triggerWorkflow(owner, String(data.repo_name), Number(data.workflow_id), ref)
      return {
        id: `${data.workflow_id}-${Date.now()}`,
        name: `Workflow ${data.workflow_id}`,
        status: 'queued',
        conclusion: null,
        html_url: `https://github.com/${owner}/${String(data.repo_name)}/actions`,
        run_number: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workflow_id: Number(data.workflow_id),
        head_branch: ref,
        event: 'workflow_dispatch',
      }
    }

    if (type === 'webhooks') {
      const missing = ['repo_name', 'url', 'events'].filter((field) => !data[field])
      if (missing.length > 0) {
        return { missing_fields: missing, defaults: { contentType: 'json' } }
      }

      return api.createHook(owner, String(data.repo_name), {
        repo_name: String(data.repo_name),
        url: String(data.url),
        events: Array.isArray(data.events)
          ? data.events.map(String)
          : String(data.events).split(',').map((item) => item.trim()).filter(Boolean),
        secret: typeof data.secret === 'string' ? data.secret : undefined,
        contentType: data.contentType === 'form' ? 'form' : 'json',
      })
    }

    if (type === 'secrets') {
      const missing = ['repo_name', 'secret_name', 'secret_value'].filter((field) => !data[field])
      if (missing.length > 0) {
        return { missing_fields: missing, defaults: {} }
      }
      return api.saveRepoSecret(owner, String(data.repo_name), String(data.secret_name), String(data.secret_value))
    }

    return { missing_fields: ['type'], defaults: {} }
  }

  /** Deletes GitHub webhooks, workflow runs, and repository secrets. */
  async deleteSubResource(type: string, accountId: string, uid: string, id: string, data: Record<string, unknown> = {}): Promise<void> {
    const { config, credentials } = await this.load(uid, accountId)
    const api = new GithubApi(credentials.token)
    const owner = String(config.owner)
    const repoName = typeof data.repo_name === 'string' ? data.repo_name : ''

    if (type === 'webhooks' && repoName) {
      await api.deleteHook(owner, repoName, Number(id))
      return
    }

    if (type === 'workflow-runs' && repoName) {
      await api.cancelWorkflowRun(owner, repoName, Number(id))
      return
    }

    if (type === 'secrets' && repoName) {
      await api.deleteRepoSecret(owner, repoName, id)
    }
  }
}

ServiceRegistry.register(new GithubService())
