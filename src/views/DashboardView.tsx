'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  getClients, getProjects, getInvoices, getActivityLog,
  checkOverdueInvoices, updateClient, fmtCurrency, fmtDate, daysSince,
} from '@/lib/data'
import type { Client, Project, Invoice, ActivityLogEntry } from '@/lib/types'
import { Badge, HealthDot, Btn, EmptyState } from '@/components/ui'
import { BarChartSimple, DonutChart } from '@/components/Charts'

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, href }: { label: string; value: string | number; sub: string; color?: string; href: string }) {
  const router = useRouter()
  return (
    <div onClick={() => router.push(href)}
      className="bg-[#111113] border border-[#27272a] rounded-xl p-4 cursor-pointer hover:border-[#3f3f46] transition-colors">
      <div className="text-[11px] text-[#52525b] font-medium uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-[22px] font-black tracking-tight mb-0.5" style={{ color: color ?? '#e4e4e7' }}>{value}</div>
      <div className="text-[11px] text-[#52525b]">{sub}</div>
    </div>
  )
}

// ── Alert Panel ───────────────────────────────────────────────────────────────
function AlertPanel({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-[#111113] border border-[#27272a] rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-bold text-[#a1a1aa]">{title}</span>
        {count > 0 && <span className="bg-[#1f1f23] border border-[#3f3f46] rounded-full px-2 text-[11px] font-bold text-[#71717a]">{count}</span>}
      </div>
      {children}
    </div>
  )
}

export default function DashboardView() {
  const router = useRouter()
  const [clients, setClients] = React.useState<Client[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [activity, setActivity] = React.useState<ActivityLogEntry[]>([])

  React.useEffect(() => {
    checkOverdueInvoices()
    setClients(getClients())
    setProjects(getProjects())
    setInvoices(getInvoices())
    setActivity(getActivityLog().slice(0, 15))
  }, [])

  const activeClients = clients.filter(c => c.subscriptionStatus === 'Active' && !c.archived)
  const mrr = activeClients.reduce((s, c) => s + Number(c.monthlyFee || 0), 0)
  const outstanding = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + Number(i.amount || 0), 0)
  const overdueInvs = invoices.filter(i => i.status === 'Overdue')
  const liveProjects = projects.filter(p => p.status === 'Live')
  const pendingApprovals = projects.filter(p => p.status === 'Awaiting Approval')
  const awaitingSetup = clients.filter(c => c.setupFeeStatus === 'Awaiting' && !c.archived)
  const today = new Date()
  const subsDue = clients.filter(c => {
    if (c.subscriptionStatus !== 'Active' || !c.billingCycleDay) return false
    const next = new Date(today.getFullYear(), today.getMonth(), c.billingCycleDay)
    if (next < today) next.setMonth(next.getMonth() + 1)
    return Math.ceil((next.getTime() - today.getTime()) / 86400000) <= 7
  })
  const stuckProjects = projects.filter(p => {
    if (['Live','Cancelled'].includes(p.status)) return false
    return (daysSince(p.updatedAt) ?? 0) >= 7
  })

  // MRR chart last 6 months
  const mrrChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const val = clients.filter(c => c.subscriptionStatus === 'Active' && c.subscriptionStartDate && new Date(c.subscriptionStartDate) <= d)
      .reduce((s, c) => s + Number(c.monthlyFee || 0), 0)
    return { month: label, mrr: val }
  })

  const statusCounts = ['Active','Pending','Paused','Churned'].map(s => ({
    name: s, value: clients.filter(c => c.subscriptionStatus === s).length,
  })).filter(d => d.value > 0)

  const COLORS = ['#fbbf24','#60a5fa','#818cf8','#f87171']

  return (
    <div className="flex-1 overflow-y-auto p-5 pb-16">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[18px] font-bold text-[#e4e4e7] tracking-tight m-0">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Active Clients" value={activeClients.length} sub="subscriptions" href="/clients" />
        <StatCard label="MRR" value={fmtCurrency(mrr)} sub="monthly recurring" color="#4ade80" href="/analytics" />
        <StatCard label="Outstanding" value={fmtCurrency(outstanding)} sub="unpaid invoices" color={outstanding > 0 ? '#fbbf24' : undefined} href="/invoices" />
        <StatCard label="Overdue" value={`${overdueInvs.length} · ${fmtCurrency(overdueInvs.reduce((s,i)=>s+Number(i.amount||0),0))}`} sub="past due" color={overdueInvs.length > 0 ? '#f87171' : undefined} href="/invoices" />
        <StatCard label="Projects Live" value={liveProjects.length} sub="deployed" href="/projects" />
        <StatCard label="Pending Approvals" value={pendingApprovals.length} sub="awaiting review" color={pendingApprovals.length > 0 ? '#fbbf24' : undefined} href="/approvals" />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <AlertPanel title="Awaiting Setup Payment" count={awaitingSetup.length}>
          {awaitingSetup.length === 0
            ? <div className="text-[12px] text-[#52525b] py-2">All setup fees collected ✓</div>
            : awaitingSetup.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-[#1f1f23] gap-2 last:border-0">
                <div>
                  <div className="text-[12px] font-semibold text-[#e4e4e7]">{c.name}</div>
                  <div className="text-[11px] text-[#71717a]">{fmtCurrency(c.setupFeeTotal)} · {daysSince(c.createdAt)}d ago</div>
                </div>
                <Btn small variant="success" onClick={() => { updateClient(c.id, { setupFeePaid: c.setupFeeTotal, setupFeeStatus: 'Paid in Full' }); setClients(getClients()) }}>Paid</Btn>
              </div>
            ))
          }
        </AlertPanel>

        <AlertPanel title="Subscriptions Due This Week" count={subsDue.length}>
          {subsDue.length === 0
            ? <div className="text-[12px] text-[#52525b] py-2">No renewals this week</div>
            : subsDue.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-[#1f1f23] gap-2 last:border-0">
                <div>
                  <div className="text-[12px] font-semibold text-[#e4e4e7]">{c.name}</div>
                  <div className="text-[11px] text-[#71717a]">{fmtCurrency(c.monthlyFee)}</div>
                </div>
                <Btn small variant="outline" onClick={() => router.push('/invoices')}>Invoice</Btn>
              </div>
            ))
          }
        </AlertPanel>

        <AlertPanel title="Stuck Projects" count={stuckProjects.length}>
          {stuckProjects.length === 0
            ? <div className="text-[12px] text-[#52525b] py-2">No stuck projects ✓</div>
            : stuckProjects.map(p => {
              const client = clients.find(c => c.id === p.clientId)
              return (
                <div key={p.id} className="py-1.5 border-b border-[#1f1f23] last:border-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[12px] font-semibold text-[#e4e4e7]">{p.name}</div>
                      <div className="text-[11px] text-[#71717a]">{client?.name} · {daysSince(p.updatedAt)}d in {p.status}</div>
                    </div>
                    <Btn small variant="outline" onClick={() => router.push('/projects')}>View</Btn>
                  </div>
                </div>
              )
            })
          }
        </AlertPanel>
      </div>

      {/* Activity + Quick Actions */}
      <div className="grid grid-cols-[1fr_280px] gap-3 mb-5">
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#e4e4e7]">Recent Activity</span>
            <button onClick={() => router.push('/activity')} className="text-[11px] text-[#fbbf24] bg-transparent border-0 cursor-pointer">View all →</button>
          </div>
          {activity.length === 0
            ? <div className="text-[12px] text-[#52525b] py-3">No activity yet</div>
            : activity.map(e => (
              <div key={e.id} className="flex gap-2.5 py-1.5 border-b border-[#18181b] items-start last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#a1a1aa]">
                    <span className="text-[#e4e4e7] font-medium">{e.action}</span>
                    {e.entityName && <span className="text-[#71717a]"> · {e.entityName}</span>}
                  </div>
                </div>
                <div className="text-[10px] text-[#52525b] whitespace-nowrap flex-shrink-0">
                  {new Date(e.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          }
        </div>

        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-3">Quick Actions</div>
          <div className="flex flex-col gap-2">
            {[
              { label: '+ Add Client',     href: '/clients',   color: '#e4e4e7' },
              { label: '+ Add Project',    href: '/projects',  color: '#e4e4e7' },
              { label: '+ Create Invoice', href: '/invoices',  color: '#e4e4e7' },
              { label: '→ Approvals',      href: '/approvals', color: '#fbbf24' },
              { label: '✦ AI Assistant',   href: '/ai',        color: '#fbbf24' },
            ].map(a => (
              <button key={a.label} onClick={() => router.push(a.href)}
                style={{ color: a.color }}
                className="text-left px-3.5 py-2.5 bg-[#18181b] border border-[#27272a] rounded-lg text-[13px] font-medium cursor-pointer hover:bg-[#1f1f23] hover:border-[#3f3f46] transition-colors">
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-[1fr_320px] gap-3">
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-3">MRR — Last 6 Months</div>
          {mrrChart.some(d => d.mrr > 0)
            ? <BarChartSimple data={mrrChart} dataKey="mrr" color="#fbbf24" height={180} formatValue={v => fmtCurrency(v)} />
            : <EmptyState icon="📊" title="No MRR data yet" subtitle="Add active clients with monthly fees." />
          }
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-3">Client Status</div>
          {statusCounts.length > 0
            ? <div className="flex flex-col items-center gap-3">
                <DonutChart data={statusCounts} colors={COLORS} size={140} />
                <div className="flex flex-col gap-1 w-full">
                  {statusCounts.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[12px]">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 text-[#a1a1aa]">{d.name}</span>
                      <span className="font-semibold text-[#e4e4e7]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            : <EmptyState icon="🍩" title="No clients yet" />
          }
        </div>
      </div>
    </div>
  )
}
