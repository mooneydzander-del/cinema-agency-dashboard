'use client'

import React from 'react'
import {
  getInvoices, getClients, createInvoice, updateInvoice, markInvoicePaid,
  deleteInvoice, nextInvoiceNumber, checkOverdueInvoices, fmtCurrency, fmtDate, exportCSV,
} from '@/lib/data'
import type { Invoice, Client } from '@/lib/types'
import { INVOICE_TYPES } from '@/lib/types'
import {
  Badge, Btn, Field, Input, Select, Textarea, Modal, Confirm,
  FilterChips, SearchInput, BulkBar, EmptyState, ShortcutBar,
  useToasts, ToastContainer,
} from '@/components/ui'

function InvoiceModal({ invoice, clients, onClose, onSave, toast }: {
  invoice?: Invoice | null; clients: Client[]; onClose: () => void
  onSave: () => void; toast: (m: string, t?: 'success'|'error'|'warn') => void
}) {
  const isEdit = !!invoice
  const [form, setForm] = React.useState<Partial<Invoice>>(invoice ?? {
    clientId: '', type: 'Monthly', amount: 0, invoiceNumber: nextInvoiceNumber(),
    issueDate: new Date().toISOString().slice(0,10), dueDate: '', notes: '',
    lineItems: [{ description: '', amount: 0 }],
  })
  function set(k: keyof Invoice, v: unknown) { setForm(f => ({ ...f, [k]: v })) }
  function setLI(i: number, k: 'description'|'amount', v: string) {
    const li = [...(form.lineItems ?? [])]
    li[i] = { ...li[i], [k]: k === 'amount' ? parseFloat(v)||0 : v }
    set('lineItems', li)
  }
  const total = (form.lineItems ?? []).reduce((s, li) => s + (Number(li.amount) || 0), 0)
  function submit() {
    if (!form.clientId) { toast('Select a client','error'); return }
    const data = { ...form, amount: total || Number(form.amount) || 0 }
    if (isEdit && invoice) { updateInvoice(invoice.id, data); toast('Updated') }
    else { createInvoice(data); toast('Invoice created') }
    onSave(); onClose()
  }
  return (
    <Modal title={isEdit ? `Edit ${invoice?.invoiceNumber}` : 'Create Invoice'} onClose={onClose} width={580}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Client" required>
          <select value={form.clientId ?? ''} onChange={e => set('clientId', e.target.value)} className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1.5 text-[13px] text-[#e4e4e7] outline-none appearance-auto">
            <option value="">Select client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Type"><Select value={form.type} onChange={v => set('type', v)} options={INVOICE_TYPES} /></Field>
        <Field label="Invoice #"><Input value={form.invoiceNumber} onChange={v => set('invoiceNumber', v)} /></Field>
        <Field label="Issue Date"><Input value={form.issueDate} onChange={v => set('issueDate', v)} type="date" /></Field>
        <Field label="Due Date"><Input value={form.dueDate} onChange={v => set('dueDate', v)} type="date" /></Field>
      </div>
      <div className="mt-4">
        <div className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Line Items</div>
        {(form.lineItems ?? []).map((li, i) => (
          <div key={i} className="flex gap-2 mb-1.5 items-center">
            <input value={li.description} onChange={e => setLI(i,'description',e.target.value)} placeholder="Description"
              className="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1.5 text-[13px] text-[#e4e4e7] outline-none" />
            <input value={li.amount} onChange={e => setLI(i,'amount',e.target.value)} placeholder="$0" type="number"
              className="w-24 bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1.5 text-[13px] text-[#e4e4e7] outline-none" />
            <button onClick={() => set('lineItems', (form.lineItems??[]).filter((_,j)=>j!==i))} className="bg-transparent border-0 cursor-pointer text-red-400 text-base">✕</button>
          </div>
        ))}
        <Btn small variant="ghost" onClick={() => set('lineItems', [...(form.lineItems??[]), { description:'', amount:0 }])}>+ Add Line Item</Btn>
        {total > 0 && <div className="text-right font-bold text-[15px] text-[#e4e4e7] mt-2">Total: {fmtCurrency(total)}</div>}
      </div>
      <div className="mt-3"><Field label="Notes"><Textarea value={form.notes} onChange={v => set('notes', v)} rows={2} /></Field></div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#27272a]">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit}>{isEdit ? 'Save' : 'Create Invoice'}</Btn>
      </div>
    </Modal>
  )
}

export default function InvoicesView() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [filter, setFilter] = React.useState('All')
  const [search, setSearch] = React.useState('')
  const [showModal, setShowModal] = React.useState(false)
  const [editInvoice, setEditInvoice] = React.useState<Invoice | null>(null)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [confirm, setConfirm] = React.useState<{ msg: string; yes: () => void } | null>(null)
  const [sortCol, setSortCol] = React.useState('createdAt')
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('desc')
  const { toasts, toast, remove } = useToasts()

  function load() { checkOverdueInvoices(); setInvoices(getInvoices()); setClients(getClients()) }
  React.useEffect(() => { load() }, [])

  function clientName(id: string) { return clients.find(c => c.id === id)?.name ?? '—' }
  function onSort(col: string) { if (col === sortCol) setSortDir(d => d==='asc'?'desc':'asc'); else { setSortCol(col); setSortDir('asc') } }

  const stats = React.useMemo(() => ({
    total: invoices.reduce((s,i) => s+Number(i.amount||0), 0),
    collected: invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+Number(i.amount||0),0),
    outstanding: invoices.filter(i=>i.status!=='Paid').reduce((s,i)=>s+Number(i.amount||0),0),
    overdue: invoices.filter(i=>i.status==='Overdue').reduce((s,i)=>s+Number(i.amount||0),0),
  }), [invoices])

  const filtered = React.useMemo(() => {
    let list = [...invoices]
    if (filter==='Unpaid') list=list.filter(i=>i.status==='Unpaid')
    else if (filter==='Paid') list=list.filter(i=>i.status==='Paid')
    else if (filter==='Overdue') list=list.filter(i=>i.status==='Overdue')
    else if (filter==='This Month') { const s=new Date(); s.setDate(1); list=list.filter(i=>new Date(i.issueDate)>=s) }
    else if (filter==='Setup Fees') list=list.filter(i=>['Setup 50%','Setup Full'].includes(i.type))
    else if (filter==='Subscriptions') list=list.filter(i=>i.type==='Monthly')
    if (search) { const q=search.toLowerCase(); list=list.filter(i=>[i.invoiceNumber,clientName(i.clientId)].some(f=>f.toLowerCase().includes(q))) }
    list.sort((a,b) => {
      const av=(a as Record<string,unknown>)[sortCol]??''; const bv=(b as Record<string,unknown>)[sortCol]??''
      return sortDir==='asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return list
  }, [invoices, filter, search, sortCol, sortDir, clients])

  function toggle(id: string) { setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n }) }

  function Th({ col, label }: { col: string; label: string }) {
    return <th onClick={()=>onSort(col)} className="text-left px-2.5 py-2 text-[11px] font-semibold text-[#52525b] bg-[#18181b] border-b border-[#27272a] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-[#a1a1aa]">
      {label} {sortCol===col?(sortDir==='asc'?'↑':'↓'):<span className="opacity-30">↕</span>}
    </th>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-4 gap-3 px-5 pt-4">
        {[
          { label:'Total Invoiced', val:fmtCurrency(stats.total), color:'#e4e4e7' },
          { label:'Collected', val:fmtCurrency(stats.collected), color:'#4ade80' },
          { label:'Outstanding', val:fmtCurrency(stats.outstanding), color:'#fbbf24' },
          { label:'Overdue', val:fmtCurrency(stats.overdue), color: stats.overdue>0?'#f87171':'#e4e4e7' },
        ].map(s => (
          <div key={s.label} className="bg-[#111113] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] text-[#52525b] font-medium uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-[20px] font-bold" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-b border-[#27272a] flex items-center gap-2.5 flex-shrink-0 flex-wrap mt-3">
        <h1 className="m-0 text-[18px] font-bold text-[#e4e4e7] tracking-tight mr-2">Invoices</h1>
        <FilterChips options={['All','Unpaid','Paid','Overdue','This Month','Setup Fees','Subscriptions']} active={filter} onChange={v=>setFilter(v||'All')} />
        <div className="flex-1" />
        <SearchInput value={search} onChange={setSearch} />
        <Btn variant="primary" onClick={() => { setEditInvoice(null); setShowModal(true) }}>+ Create Invoice</Btn>
        <Btn variant="outline" small onClick={() => exportCSV(filtered.map(i=>({ Number:i.invoiceNumber, Client:clientName(i.clientId), Type:i.type, Amount:i.amount, Status:i.status })),'invoices.csv')}>Export CSV</Btn>
      </div>

      <div className="px-5 pt-2">
        <BulkBar count={selected.size} onClear={()=>setSelected(new Set())} actions={[
          { label:'Mark Paid', onClick:()=>{ selected.forEach(id=>markInvoicePaid(id)); setSelected(new Set()); load(); toast(`Marked ${selected.size} paid`) } },
          { label:'Delete', onClick:()=>setConfirm({ msg:`Delete ${selected.size} invoices?`, yes:()=>{ selected.forEach(id=>deleteInvoice(id)); setSelected(new Set()); load(); setConfirm(null); toast('Deleted','warn') } }) },
        ]} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-16">
        {!filtered.length ? <EmptyState icon="🧾" title="No invoices" action={<Btn onClick={()=>setShowModal(true)}>+ Create Invoice</Btn>} /> : (
          <table className="cinema-table">
            <thead>
              <tr>
                <th className="w-9 bg-[#18181b] border-b border-[#27272a] px-2.5 py-2"><input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={()=>setSelected(selected.size===filtered.length?new Set():new Set(filtered.map(i=>i.id)))} className="accent-[#fbbf24]" /></th>
                <Th col="invoiceNumber" label="Invoice #" />
                <Th col="clientId" label="Client" />
                <Th col="type" label="Type" />
                <Th col="amount" label="Amount" />
                <Th col="issueDate" label="Issued" />
                <Th col="dueDate" label="Due" />
                <Th col="status" label="Status" />
                <Th col="paidAt" label="Paid Date" />
                <th className="bg-[#18181b] border-b border-[#27272a]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const isOverdue = inv.status === 'Overdue'
                return (
                  <tr key={inv.id} className={selected.has(inv.id) ? 'bg-[#1f1f23]' : isOverdue ? 'bg-[rgba(239,68,68,0.03)]' : ''}>
                    <td className="px-2.5 py-2"><input type="checkbox" checked={selected.has(inv.id)} onChange={()=>toggle(inv.id)} className="accent-[#fbbf24]" /></td>
                    <td className="px-2.5 py-2 font-semibold text-[#e4e4e7]">{inv.invoiceNumber}</td>
                    <td className="px-2.5 py-2">{clientName(inv.clientId)}</td>
                    <td className="px-2.5 py-2"><Badge status={inv.type} small /></td>
                    <td className="px-2.5 py-2 font-semibold text-[#e4e4e7]">{fmtCurrency(inv.amount)}</td>
                    <td className="px-2.5 py-2 text-[#52525b] text-[12px]">{fmtDate(inv.issueDate)}</td>
                    <td className={`px-2.5 py-2 text-[12px] ${isOverdue?'text-[#f87171] font-semibold':''}`}>{fmtDate(inv.dueDate)}</td>
                    <td className="px-2.5 py-2"><Badge status={inv.status} /></td>
                    <td className="px-2.5 py-2 text-[#52525b] text-[12px]">{inv.paidAt ? fmtDate(inv.paidAt) : '—'}</td>
                    <td className="px-2.5 py-2">
                      <div className="flex gap-1 items-center">
                        {inv.status !== 'Paid' && <Btn small variant="success" onClick={()=>{ markInvoicePaid(inv.id); load(); toast('Marked paid') }}>Paid</Btn>}
                        <Btn small variant="ghost" onClick={()=>{ setEditInvoice(inv); setShowModal(true) }}>Edit</Btn>
                        <Btn small variant="ghost" onClick={()=>setConfirm({ msg:`Delete ${inv.invoiceNumber}?`, yes:()=>{ deleteInvoice(inv.id); load(); setConfirm(null); toast('Deleted','warn') } })} className="text-red-400">Del</Btn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ShortcutBar shortcuts={[{key:'N',label:'New invoice'},{key:'/',label:'Search'}]} />
      {showModal && <InvoiceModal invoice={editInvoice} clients={clients} onClose={()=>setShowModal(false)} onSave={load} toast={toast} />}
      {confirm && <Confirm message={confirm.msg} onConfirm={confirm.yes} onCancel={()=>setConfirm(null)} />}
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  )
}
