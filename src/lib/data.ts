'use client'

import type {
  Client, Project, Invoice, ActivityLogEntry,
  ProjectChecklist, ProjectStatus,
} from './types'

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEYS = {
  clients: 'cinema_clients',
  projects: 'cinema_projects',
  invoices: 'cinema_invoices',
  activityLog: 'cinema_activity_log',
  preferences: 'cinema_preferences',
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function load<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch { return null }
}

function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Activity Log ──────────────────────────────────────────────────────────────

export function logActivity(
  action: string,
  entityType: 'Client' | 'Project' | 'Invoice',
  entityId: string,
  entityName: string,
  details: string,
  source: 'Manual' | 'AI' = 'Manual',
): void {
  const log = load<ActivityLogEntry[]>(KEYS.activityLog) ?? []
  log.unshift({ id: uid(), timestamp: new Date().toISOString(), action, entityType, entityId, entityName, details, source })
  save(KEYS.activityLog, log.slice(0, 500))
}

export function getActivityLog(): ActivityLogEntry[] {
  return load<ActivityLogEntry[]>(KEYS.activityLog) ?? []
}

// ── Health Score ──────────────────────────────────────────────────────────────

export function calcHealthScore(client: Client, _projects: Project[], invoices: Invoice[]): number {
  let score = 100
  if (client.subscriptionStatus === 'Churned') return 0
  if (client.subscriptionStatus === 'Paused') score -= 30
  if (client.subscriptionStatus === 'Pending') score -= 20
  const clientInvoices = invoices.filter(i => i.clientId === client.id)
  score -= clientInvoices.filter(i => i.status === 'Overdue').length * 15
  const daysSinceUpdate = Math.floor((Date.now() - new Date(client.updatedAt || client.createdAt).getTime()) / 86400000)
  if (daysSinceUpdate > 30) score -= 10
  if (daysSinceUpdate > 60) score -= 10
  if (client.setupFeeStatus === 'Awaiting') score -= 10
  return Math.max(0, Math.min(100, score))
}

export function healthColor(score: number): string {
  if (score >= 70) return '#4ade80'
  if (score >= 40) return '#fbbf24'
  return '#f87171'
}

// ── Clients ───────────────────────────────────────────────────────────────────

export function getClients(): Client[] { return load<Client[]>(KEYS.clients) ?? [] }
export function saveClients(clients: Client[]): void { save(KEYS.clients, clients) }

export function createClient(data: Partial<Client>): Client {
  const clients = getClients()
  const client: Client = {
    id: uid(), name: '', businessName: '', email: '', phone: '', industry: '',
    website: '', offer: 'Launch Package', setupFeeTotal: 0, setupFeePaid: 0,
    setupFeeStatus: 'Awaiting', monthlyFee: 0, billingCycleDay: 1,
    subscriptionStatus: 'Pending', subscriptionStartDate: '', adPlatforms: [],
    adSpend: '', notes: '', pinned: false, healthScore: 100,
    changelog: [], archived: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...data,
  }
  clients.push(client)
  saveClients(clients)
  logActivity('Created client', 'Client', client.id, client.name || 'New Client', '')
  return client
}

export function updateClient(id: string, updates: Partial<Client>): Client | null {
  const clients = getClients()
  const idx = clients.findIndex(c => c.id === id)
  if (idx === -1) return null
  const old = { ...clients[idx] }
  const changeEntries = Object.keys(updates)
    .filter(k => k !== 'updatedAt' && k !== 'changelog')
    .map(k => `${k}: ${JSON.stringify((old as Record<string,unknown>)[k])} → ${JSON.stringify((updates as Record<string,unknown>)[k])}`)
  clients[idx] = { ...clients[idx], ...updates, updatedAt: new Date().toISOString() }
  if (!clients[idx].changelog) clients[idx].changelog = []
  if (changeEntries.length) {
    clients[idx].changelog.unshift({ id: uid(), timestamp: new Date().toISOString(), changes: changeEntries, source: 'Manual' })
  }
  saveClients(clients)
  if (changeEntries.length) logActivity('Updated client', 'Client', id, clients[idx].name, changeEntries.join('; '))
  return clients[idx]
}

export function deleteClient(id: string): void {
  const clients = getClients()
  const client = clients.find(c => c.id === id)
  saveClients(clients.filter(c => c.id !== id))
  if (client) logActivity('Deleted client', 'Client', id, client.name, '')
}

export function duplicateClient(id: string): Client | null {
  const src = getClients().find(c => c.id === id)
  if (!src) return null
  return createClient({ ...src, id: undefined as unknown as string, name: src.name + ' (Copy)', pinned: false, changelog: [] })
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function getProjects(): Project[] { return load<Project[]>(KEYS.projects) ?? [] }
export function saveProjects(projects: Project[]): void { save(KEYS.projects, projects) }

const DEFAULT_CHECKLIST: ProjectChecklist = {
  designComplete: false, devComplete: false, formConnected: false,
  webhookConnected: false, notificationsConfigured: false,
  reviewSent: false, approved: false, deployed: false,
  domainConnected: false, subscriptionActivated: false,
}

export function createProject(data: Partial<Project>): Project {
  const projects = getProjects()
  const project: Project = {
    id: uid(), clientId: '', name: '', description: '', status: 'New',
    vercelUrl: '', liveUrl: '', dueDate: '',
    checklist: { ...DEFAULT_CHECKLIST },
    notes: '', revisionNotes: '', timeline: [], changelog: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...data,
  }
  projects.push(project)
  saveProjects(projects)
  logActivity('Created project', 'Project', project.id, project.name || 'New Project', '')
  return project
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getProjects()
  const idx = projects.findIndex(p => p.id === id)
  if (idx === -1) return null
  const old = { ...projects[idx] }
  const changeEntries = Object.keys(updates)
    .filter(k => k !== 'updatedAt' && k !== 'timeline' && k !== 'changelog')
    .map(k => `${k}: ${JSON.stringify((old as Record<string,unknown>)[k])} → ${JSON.stringify((updates as Record<string,unknown>)[k])}`)
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() }
  if (!projects[idx].changelog) projects[idx].changelog = []
  if (changeEntries.length) {
    projects[idx].changelog.unshift({ id: uid(), timestamp: new Date().toISOString(), changes: changeEntries, source: 'Manual' })
  }
  if (updates.status && updates.status !== old.status) {
    if (!projects[idx].timeline) projects[idx].timeline = []
    projects[idx].timeline.unshift({ id: uid(), timestamp: new Date().toISOString(), from: old.status, to: updates.status as ProjectStatus })
  }
  saveProjects(projects)
  if (changeEntries.length) logActivity('Updated project', 'Project', id, projects[idx].name, changeEntries.join('; '))
  return projects[idx]
}

export function deleteProject(id: string): void {
  const projects = getProjects()
  const project = projects.find(p => p.id === id)
  saveProjects(projects.filter(p => p.id !== id))
  if (project) logActivity('Deleted project', 'Project', id, project.name, '')
}

export function duplicateProject(id: string): Project | null {
  const src = getProjects().find(p => p.id === id)
  if (!src) return null
  return createProject({ ...src, id: undefined as unknown as string, name: src.name + ' (Copy)', timeline: [], changelog: [] })
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export function getInvoices(): Invoice[] { return load<Invoice[]>(KEYS.invoices) ?? [] }
export function saveInvoices(invoices: Invoice[]): void { save(KEYS.invoices, invoices) }

export function nextInvoiceNumber(): string {
  const invoices = getInvoices()
  if (!invoices.length) return 'INV-001'
  const nums = invoices.map(i => parseInt((i.invoiceNumber || '').replace('INV-', '')) || 0)
  return 'INV-' + String(Math.max(...nums) + 1).padStart(3, '0')
}

export function createInvoice(data: Partial<Invoice>): Invoice {
  const invoices = getInvoices()
  const invoice: Invoice = {
    id: uid(), clientId: '', invoiceNumber: nextInvoiceNumber(),
    type: 'Monthly', amount: 0, lineItems: [],
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '', status: 'Unpaid', paidAt: null, notes: '',
    createdAt: new Date().toISOString(),
    ...data,
  }
  invoices.push(invoice)
  saveInvoices(invoices)
  logActivity('Created invoice', 'Invoice', invoice.id, invoice.invoiceNumber, `$${invoice.amount}`)
  return invoice
}

export function updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
  const invoices = getInvoices()
  const idx = invoices.findIndex(i => i.id === id)
  if (idx === -1) return null
  invoices[idx] = { ...invoices[idx], ...updates }
  saveInvoices(invoices)
  logActivity('Updated invoice', 'Invoice', id, invoices[idx].invoiceNumber, Object.keys(updates).join(', '))
  return invoices[idx]
}

export function markInvoicePaid(id: string): Invoice | null {
  const invoices = getInvoices()
  const idx = invoices.findIndex(i => i.id === id)
  if (idx === -1) return null
  invoices[idx] = { ...invoices[idx], status: 'Paid', paidAt: new Date().toISOString() }
  saveInvoices(invoices)
  logActivity('Marked invoice paid', 'Invoice', id, invoices[idx].invoiceNumber, `$${invoices[idx].amount}`)
  return invoices[idx]
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices()
  const inv = invoices.find(i => i.id === id)
  saveInvoices(invoices.filter(i => i.id !== id))
  if (inv) logActivity('Deleted invoice', 'Invoice', id, inv.invoiceNumber, '')
}

export function checkOverdueInvoices(): Invoice[] {
  const invoices = getInvoices()
  const today = new Date()
  let changed = false
  const updated = invoices.map(inv => {
    if (inv.status === 'Unpaid' && inv.dueDate && new Date(inv.dueDate) < today) {
      changed = true
      return { ...inv, status: 'Overdue' as const }
    }
    return inv
  })
  if (changed) saveInvoices(updated)
  return updated
}

// ── Preferences ───────────────────────────────────────────────────────────────

export function getPrefs(): Record<string, unknown> {
  return load<Record<string, unknown>>(KEYS.preferences) ?? {}
}
export function savePrefs(prefs: Record<string, unknown>): void { save(KEYS.preferences, prefs) }
export function setPref(key: string, value: unknown): void { savePrefs({ ...getPrefs(), [key]: value }) }
export function getPref<T>(key: string, def: T): T {
  const p = getPrefs()
  return p[key] !== undefined ? (p[key] as T) : def
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function fmtCurrency(n: number | string | undefined): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0)
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function daysSince(d: string | null | undefined): number | null {
  if (!d) return null
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

export function exportCSV(rows: Record<string, unknown>[], filename: string): void {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
