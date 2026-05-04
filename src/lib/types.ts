// ── Types ─────────────────────────────────────────────────────────────────────

export type OfferType = 'Launch Package' | 'Full Automation'
export type SubscriptionStatus = 'Pending' | 'Active' | 'Paused' | 'Churned'
export type SetupFeeStatus = 'Awaiting' | '50% Paid' | 'Paid in Full'
export type ProjectStatus =
  | 'New' | 'In Progress' | 'Awaiting Approval' | 'Revision Requested'
  | 'Approved' | 'Live' | 'On Hold' | 'Cancelled'
export type InvoiceStatus = 'Unpaid' | 'Paid' | 'Overdue'
export type InvoiceType = 'Setup 50%' | 'Setup Full' | 'Monthly' | 'Custom'

export interface ChangelogEntry {
  id: string
  timestamp: string
  changes: string[]
  source: 'Manual' | 'AI'
}

export interface Client {
  id: string
  name: string
  businessName: string
  email: string
  phone: string
  industry: string
  website: string
  offer: OfferType
  setupFeeTotal: number
  setupFeePaid: number
  setupFeeStatus: SetupFeeStatus
  monthlyFee: number
  billingCycleDay: number
  subscriptionStatus: SubscriptionStatus
  subscriptionStartDate: string
  adPlatforms: string[]
  adSpend: string
  notes: string
  pinned: boolean
  healthScore: number
  changelog: ChangelogEntry[]
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectChecklist {
  designComplete: boolean
  devComplete: boolean
  formConnected: boolean
  webhookConnected: boolean
  notificationsConfigured: boolean
  reviewSent: boolean
  approved: boolean
  deployed: boolean
  domainConnected: boolean
  subscriptionActivated: boolean
}

export interface TimelineEntry {
  id: string
  timestamp: string
  from: ProjectStatus
  to: ProjectStatus
}

export interface Project {
  id: string
  clientId: string
  name: string
  description: string
  status: ProjectStatus
  vercelUrl: string
  liveUrl: string
  dueDate: string
  checklist: ProjectChecklist
  notes: string
  revisionNotes: string
  timeline: TimelineEntry[]
  changelog: ChangelogEntry[]
  createdAt: string
  updatedAt: string
}

export interface LineItem {
  description: string
  amount: number
}

export interface Invoice {
  id: string
  clientId: string
  invoiceNumber: string
  type: InvoiceType
  amount: number
  lineItems: LineItem[]
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  paidAt: string | null
  notes: string
  createdAt: string
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  action: string
  entityType: 'Client' | 'Project' | 'Invoice'
  entityId: string
  entityName: string
  details: string
  source: 'Manual' | 'AI'
}

export const OFFER_TYPES: OfferType[] = ['Launch Package', 'Full Automation']
export const PROJECT_STATUSES: ProjectStatus[] = [
  'New', 'In Progress', 'Awaiting Approval', 'Revision Requested',
  'Approved', 'Live', 'On Hold', 'Cancelled',
]
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['Pending', 'Active', 'Paused', 'Churned']
export const INVOICE_TYPES: InvoiceType[] = ['Setup 50%', 'Setup Full', 'Monthly', 'Custom']

export const CHECKLIST_LABELS: Record<keyof ProjectChecklist, string> = {
  designComplete: 'Design Complete',
  devComplete: 'Dev Complete',
  formConnected: 'Form Connected',
  webhookConnected: 'Webhook Connected',
  notificationsConfigured: 'Notifications Configured',
  reviewSent: 'Review Sent',
  approved: 'Approved',
  deployed: 'Deployed',
  domainConnected: 'Domain Connected',
  subscriptionActivated: 'Subscription Activated',
}
