'use client'

import React from 'react'
import {
  getClients, getProjects, getInvoices, createClient, updateClient,
  deleteClient, duplicateClient, calcHealthScore, fmtCurrency, fmtDate, exportCSV,
} from '@/lib/data'
import type { Client } from '@/lib/types'
import { OFFER_TYPES, SUBSCRIPTION_STATUSES } from '@/lib/types'
import {
  Badge, HealthDot, Btn, Field, Input, Select, Textarea,
  Modal, Confirm, FilterChips, SearchInput, BulkBar, InlineEdit,
  EmptyState, ShortcutBar, useToasts, ToastContainer, CopyBtn, Tabs,
} from '@/components/ui'

// ── Client Drawer ─────────────────────────────────────────────────────────────
function ClientDrawer({ clientId, onClose, toast, onRefresh }: {
  clientId: string; onClose: () => void
  toast: (m: string, t?: 'success'|'error'|'warn') => void
  onRefresh: () => void
}) {
  const [client, setClient] = React.useState<Client | null>(null)
  const [tab, setTab] = React.useState('Overview')
  const [projects, setProjects] = React.useState(getProjects().filter(p => p.clientId === clientId))
  const [invoices, setInvoices] = React.useState(getInvoices().filter(i => i.clientId === clientId))

  function reload() {
    const c = getClients().find(x => x.id === clientId) ?? null
    setClient(c)
    setProjects(getProjects().filter(p => p.clientId === clientId))
    setInvoices(getInvoices().filter(i => i.clientId === clientId))
  }
  React.useEffect(() => { reload() }, [clientId])

  function save(updates: Partial<Client>) {
    updateClient(clientId, updates); reload(); onRefresh(); toast('Saved')
  }

  if (!client) return null
  const healthScore = calcHealthScore(client, getProjects(), getInvoices())
  const setupPct = client.setupFeeTotal > 0 ? Math.round((client.setupFeePaid / client.setupFeeTotal) * 100) : 0

  function DR({ label, value, onSave, type, options }: { label: string; value: string | number | undefined; onSave: (v: string) => void; type?: string; options?: string[] }) {
    return (
      <div className="grid gap-2 py-1.5 border-b border-[#1f1f23]" style={{ gridTemplateColumns: '140px 1fr' }}>
        <span className="text-[12px] text-[#71717a] font-medium pt-0.5">{label}</span>
        <InlineEdit value={value} onSave={onSave} type={type} options={options} />
      </div>
    )
  }

  return (
    <div className="fixed top-0 right-0 w-[600px] h-screen bg-[#111113] border-l border-[#27272a] z-50 flex flex-col animate-slide-in-right shadow-2xl">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#27272a] flex-shrink-0">
        <HealthDot score={healthScore} />
        <div className="flex-1">
          <h2 className="m-0 text-[16px] font-bold text-[#e4e4e7]">{client.name || 'Unnamed'}</h2>
          <div className="text-[12px] text-[#71717a]">{client.businessName}</div>
        </div>
        <Badge status={client.subscriptionStatus} />
        <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-[#71717a] text-xl px-1">✕</button>
      </div>

      <div className="flex-shrink-0 px-5 border-b border-[#27272a]">
        <Tabs tabs={['Overview','Projects','Invoices','Notes','Changelog']} active={tab} onChange={setTab} />
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'Overview' && (
          <div className="flex flex-col gap-5">
            <section>
              <div className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Contact</div>
              <DR label="Name" value={client.name} onSave={v => save({ name: v })} />
              <DR label="Business" value={client.businessName} onSave={v => save({ businessName: v })} />
              <div className="grid gap-2 py-1.5 border-b border-[#1f1f23]" style={{ gridTemplateColumns: '140px 1fr' }}>
                <span className="text-[12px] text-[#71717a] font-medium">Email</span>
                <div className="flex items-center gap-1"><InlineEdit value={client.email} onSave={v => save({ email: v })} /><CopyBtn value={client.email} /></div>
              </div>
              <div className="grid gap-2 py-1.5 border-b border-[#1f1f23]" style={{ gridTemplateColumns: '140px 1fr' }}>
                <span className="text-[12px] text-[#71717a] font-medium">Phone</span>
                <div className="flex items-center gap-1"><InlineEdit value={client.phone} onSave={v => save({ phone: v })} /><CopyBtn value={client.phone} /></div>
              </div>
              <DR label="Industry" value={client.industry} onSave={v => save({ industry: v })} />
            </section>

            <section>
              <div className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Billing</div>
              <DR label="Offer" value={client.offer} onSave={v => save({ offer: v as Client['offer'] })} options={OFFER_TYPES} />
              <DR label="Monthly Fee" value={client.monthlyFee} onSave={v => save({ monthlyFee: parseFloat(v) || 0 })} type="number" />
              <DR label="Status" value={client.subscriptionStatus} onSave={v => save({ subscriptionStatus: v as Client['subscriptionStatus'] })} options={SUBSCRIPTION_STATUSES} />
            </section>

            <section>
              <div className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Setup Fee</div>
              <DR label="Total" value={client.setupFeeTotal} onSave={v => save({ setupFeeTotal: parseFloat(v) || 0 })} type="number" />
              <DR label="Paid" value={client.setupFeePaid} onSave={v => save({ setupFeePaid: parseFloat(v) || 0 })} type="number" />
              <div className="py-2">
                <div className="flex justify-between text-[12px] text-[#71717a] mb-1">
                  <span>{fmtCurrency(client.setupFeePaid)} paid of {fmtCurrency(client.setupFeeTotal)}</span>
                  <Badge status={client.setupFeeStatus} small />
                </div>
                <div className="bg-[#27272a] rounded h-1.5">
                  <div className="h-1.5 rounded transition-all duration-300" style={{ width: `${Math.min(100, setupPct)}%`, background: setupPct >= 100 ? '#4ade80' : '#fbbf24' }} />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Btn small variant="secondary" onClick={() => save({ setupFeePaid: client.setupFeeTotal / 2, setupFeeStatus: '50% Paid' })}>Mark 50% Paid</Btn>
                <Btn small variant="success" onClick={() => save({ setupFeePaid: client.setupFeeTotal, setupFeeStatus: 'Paid in Full' })}>Mark Paid in Full</Btn>
              </div>
            </section>
          </div>
        )}

        {tab === 'Projects' && (
          <div className="flex flex-col gap-2">
            {projects.length === 0 ? <EmptyState icon="📁" title="No projects" /> : projects.map(p => {
              const done = Object.values(p.checklist).filter(Boolean).length
              return (
                <div key={p.id} className="border border-[#27272a] rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[13px] font-semibold text-[#e4e4e7]">{p.name}</span>
                    <Badge status={p.status} small />
                  </div>
                  <div className="text-[12px] text-[#71717a] flex gap-3">
                    {p.dueDate && <span>Due {fmtDate(p.dueDate)}</span>}
                    <span>{done}/10 ✓</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'Invoices' && (
          <div className="flex flex-col gap-1.5">
            {invoices.length === 0 ? <EmptyState icon="🧾" title="No invoices" /> : invoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-2.5 p-3 border border-[#27272a] rounded-lg text-[13px]">
                <span className="font-semibold text-[#e4e4e7] min-w-[80px]">{inv.invoiceNumber}</span>
                <Badge status={inv.type} small />
                <span className="flex-1 text-[#a1a1aa]">{fmtCurrency(inv.amount)}</span>
                <span className="text-[#71717a]">{fmtDate(inv.dueDate)}</span>
                <Badge status={inv.status} small />
              </div>
            ))}
          </div>
        )}

        {tab === 'Notes' && (
          <textarea value={client.notes || ''} onChange={e => save({ notes: e.target.value })}
            placeholder="Add notes…" rows={12}
            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-3 text-[13px] text-[#e4e4e7] resize-y outline-none focus:border-[#fbbf24] leading-relaxed" />
        )}

        {tab === 'Changelog' && (
          <div className="flex flex-col gap-2">
            {(!client.changelog || client.changelog.length === 0)
              ? <EmptyState icon="📋" title="No changes logged yet" />
              : client.changelog.map(e => (
                <div key={e.id} className="p-3 bg-[#18181b] rounded-lg border border-[#27272a]">
                  <div className="flex gap-2 items-center mb-1">
                    <span className="text-[11px] text-[#52525b]">{fmtDate(e.timestamp)}</span>
                    <span className={`text-[11px] px-1.5 rounded font-medium ${e.source === 'AI' ? 'bg-[rgba(139,92,246,0.12)] text-[#a78bfa]' : 'bg-[#27272a] text-[#71717a]'}`}>{e.source}</span>
                  </div>
                  {e.changes.map((c, i) => <div key={i} className="text-[12px] text-[#a1a1aa] font-mono">{c}</div>)}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ── Client Modal ──────────────────────────────────────────────────────────────
function ClientModal({ client, onClose, onSave, toast }: {
  client?: Client | null
  onClose: () => void
  onSave: () => void
  toast: (m: string, t?: 'success'|'error'|'warn') => void
}) {
  const isEdit = !!client
  const [form, setForm] = React.useState<Partial<Client>>(client ?? {
    name: '', businessName: '', email: '', phone: '', industry: '', website: '',
    offer: 'Launch Package', setupFeeTotal: 0, monthlyFee: 0, billingCycleDay: 1,
    subscriptionStatus: 'Pending', subscriptionStartDate: '', notes: '',
  })
  function set(k: keyof Client, v: unknown) { setForm(f => ({ ...f, [k]: v })) }
  function submit() {
    if (!form.name) { toast('Name required', 'error'); return }
    if (isEdit && client) { updateClient(client.id, form); toast('Client updated') }
    else { createClient(form); toast('Client created') }
    onSave(); onClose()
  }
  return (
    <Modal title={isEdit ? `Edit ${client?.name}` : 'Add New Client'} onClose={onClose} width={640}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
        <div className="col-span-2"><Field label="Name" required><Input value={form.name} onChange={v => set('name', v)} /></Field></div>
        <Field label="Business Name"><Input value={form.businessName} onChange={v => set('businessName', v)} /></Field>
        <Field label="Email"><Input value={form.email} onChange={v => set('email', v)} type="email" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={v => set('phone', v)} /></Field>
        <Field label="Industry"><Input value={form.industry} onChange={v => set('industry', v)} /></Field>
        <Field label="Offer"><Select value={form.offer} onChange={v => set('offer', v)} options={OFFER_TYPES} /></Field>
        <Field label="Status"><Select value={form.subscriptionStatus} onChange={v => set('subscriptionStatus', v)} options={SUBSCRIPTION_STATUSES} /></Field>
        <Field label="Setup Fee ($)"><Input value={String(form.setupFeeTotal ?? '')} onChange={v => set('setupFeeTotal', parseFloat(v)||0)} type="number" /></Field>
        <Field label="Monthly Fee ($)"><Input value={String(form.monthlyFee ?? '')} onChange={v => set('monthlyFee', parseFloat(v)||0)} type="number" /></Field>
        <div className="col-span-2"><Field label="Notes"><Textarea value={form.notes} onChange={v => set('notes', v)} rows={2} /></Field></div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#27272a]">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit}>{isEdit ? 'Save Changes' : 'Create Client'}</Btn>
      </div>
    </Modal>
  )
}

// ── Clients View ──────────────────────────────────────────────────────────────
export default function ClientsView() {
  const [clients, setClients] = React.useState<Client[]>([])
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('All')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [showModal, setShowModal] = React.useState(false)
  const [editClient, setEditClient] = React.useState<Client | null>(null)
  const [drawerClientId, setDrawerClientId] = React.useState<string | null>(null)
  const [confirm, setConfirm] = React.useState<{ msg: string; yes: () => void } | null>(null)
  const [sortCol, setSortCol] = React.useState('name')
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('asc')
  const { toasts, toast, remove } = useToasts()

  function load() {
    let all = getClients()
    const invs = getInvoices(); const projs = getProjects()
    all = all.map(c => ({ ...c, healthScore: calcHealthScore(c, projs, invs) }))
    setClients(all)
  }
  React.useEffect(() => { load() }, [])

  function onSort(col: string) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = React.useMemo(() => {
    let list = [...clients]
    if (statusFilter === 'Archived') list = list.filter(c => c.archived)
    else if (statusFilter !== 'All') list = list.filter(c => !c.archived && c.subscriptionStatus === statusFilter)
    else list = list.filter(c => !c.archived)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => [c.name, c.businessName, c.email].some(f => (f||'').toLowerCase().includes(q)))
    }
    list.sort((a, b) => {
      const av = (a as Record<string,unknown>)[sortCol] ?? ''
      const bv = (b as Record<string,unknown>)[sortCol] ?? ''
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return [...list.filter(c => c.pinned), ...list.filter(c => !c.pinned)]
  }, [clients, statusFilter, search, sortCol, sortDir])

  function toggleAll() { setSelected(filtered.length === selected.size ? new Set() : new Set(filtered.map(c => c.id))) }
  function toggle(id: string) { setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  function Th({ col, label }: { col: string; label: string }) {
    return (
      <th onClick={() => onSort(col)} className="text-left px-2.5 py-2 text-[11px] font-semibold text-[#52525b] bg-[#18181b] border-b border-[#27272a] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-[#a1a1aa]">
        {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}
      </th>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[#27272a] flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-2.5">
          <h1 className="m-0 text-[18px] font-bold text-[#e4e4e7] flex-1 tracking-tight">Clients</h1>
          <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" />
          <Btn variant="primary" onClick={() => { setEditClient(null); setShowModal(true) }}>+ Add Client</Btn>
          <Btn variant="outline" small onClick={() => exportCSV(filtered.map(c => ({ Name: c.name, Business: c.businessName, Email: c.email, Offer: c.offer, Monthly: c.monthlyFee, Status: c.subscriptionStatus })), 'clients.csv')}>Export CSV</Btn>
        </div>
        <FilterChips options={['All','Active','Pending','Paused','Churned','Archived']} active={statusFilter} onChange={v => setStatusFilter(v||'All')} />
      </div>

      <div className="px-5 pt-2">
        <BulkBar count={selected.size} onClear={() => setSelected(new Set())} actions={[
          { label: 'Active', onClick: () => { selected.forEach(id => updateClient(id, { subscriptionStatus: 'Active' })); setSelected(new Set()); load(); toast(`Updated ${selected.size} clients`) } },
          { label: 'Archive', onClick: () => { selected.forEach(id => updateClient(id, { archived: true })); setSelected(new Set()); load(); toast('Archived') } },
          { label: 'Delete', onClick: () => setConfirm({ msg: `Delete ${selected.size} clients?`, yes: () => { selected.forEach(id => deleteClient(id)); setSelected(new Set()); load(); setConfirm(null); toast('Deleted','warn') } }) },
        ]} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-16">
        {filtered.length === 0
          ? <EmptyState icon="👥" title="No clients found" subtitle="Add your first client." action={<Btn onClick={() => setShowModal(true)}>+ Add Client</Btn>} />
          : (
            <table className="cinema-table">
              <thead>
                <tr>
                  <th className="w-9 bg-[#18181b] border-b border-[#27272a] px-2.5 py-2"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-[#fbbf24]" /></th>
                  <th className="w-8 bg-[#18181b] border-b border-[#27272a]" />
                  <th className="w-4 bg-[#18181b] border-b border-[#27272a]" />
                  <Th col="name" label="Name" />
                  <Th col="businessName" label="Business" />
                  <Th col="offer" label="Offer" />
                  <Th col="setupFeeTotal" label="Setup Fee" />
                  <Th col="monthlyFee" label="MRR" />
                  <Th col="subscriptionStatus" label="Status" />
                  <Th col="updatedAt" label="Last Activity" />
                  <th className="bg-[#18181b] border-b border-[#27272a]" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className={selected.has(c.id) ? 'bg-[#1f1f23]' : ''}>
                    <td className="px-2.5 py-2"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="accent-[#fbbf24]" /></td>
                    <td className="px-1"><button onClick={() => updateClient(c.id, { pinned: !c.pinned }) && load()} className="bg-transparent border-0 cursor-pointer text-sm" style={{ opacity: c.pinned ? 1 : 0.25 }}>⭐</button></td>
                    <td className="px-1"><HealthDot score={c.healthScore ?? 100} /></td>
                    <td className="px-2.5 py-2"><button onClick={() => setDrawerClientId(c.id)} className="bg-transparent border-0 cursor-pointer text-[#fbbf24] font-semibold text-[13px] underline p-0">{c.name || '—'}</button></td>
                    <td className="px-2.5 py-2 text-[#a1a1aa]">{c.businessName || '—'}</td>
                    <td className="px-2.5 py-2"><Badge status={c.offer} small /></td>
                    <td className="px-2.5 py-2"><div className="flex items-center gap-1.5"><span className="text-[#a1a1aa]">{fmtCurrency(c.setupFeeTotal)}</span><Badge status={c.setupFeeStatus} small /></div></td>
                    <td className="px-2.5 py-2 text-[#a1a1aa]">{fmtCurrency(c.monthlyFee)}</td>
                    <td className="px-2.5 py-2"><Badge status={c.subscriptionStatus} small /></td>
                    <td className="px-2.5 py-2 text-[#52525b] text-[12px]">{fmtDate(c.updatedAt)}</td>
                    <td className="px-2.5 py-2">
                      <div className="flex gap-1">
                        <Btn small variant="ghost" onClick={() => setDrawerClientId(c.id)}>View</Btn>
                        <Btn small variant="ghost" onClick={() => { setEditClient(c); setShowModal(true) }}>Edit</Btn>
                        <Btn small variant="ghost" onClick={() => setConfirm({ msg: `Delete ${c.name}?`, yes: () => { deleteClient(c.id); load(); setConfirm(null); toast('Deleted','warn') } })} className="text-red-400">Del</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      <ShortcutBar shortcuts={[{key:'N',label:'New client'},{key:'/',label:'Search'},{key:'Esc',label:'Close'}]} />

      {showModal && <ClientModal client={editClient} onClose={() => setShowModal(false)} onSave={load} toast={toast} />}
      {drawerClientId && <ClientDrawer clientId={drawerClientId} onClose={() => setDrawerClientId(null)} toast={toast} onRefresh={load} />}
      {drawerClientId && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerClientId(null)} />}
      {confirm && <Confirm message={confirm.msg} onConfirm={confirm.yes} onCancel={() => setConfirm(null)} />}
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  )
}
