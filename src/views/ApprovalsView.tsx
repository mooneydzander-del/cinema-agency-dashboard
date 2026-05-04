'use client'

import React from 'react'
import { getProjects, getClients, updateProject } from '@/lib/data'
import type { Project, Client } from '@/lib/types'
import { Badge, Btn, CopyBtn, EmptyState, ShortcutBar, useToasts, ToastContainer, Confirm } from '@/components/ui'
import { CHECKLIST_LABELS } from '@/lib/types'
import { fmtDate, daysSince } from '@/lib/data'

function ApprovalCard({ project: p, client, onApprove, onRevision, onCopyMsg, onRefresh, toast }: {
  project: Project; client: Client | undefined
  onApprove: () => void; onRevision: (notes: string) => void
  onCopyMsg: () => void; onRefresh: () => void
  toast: (m: string, t?: 'success'|'error'|'warn') => void
}) {
  const [revNotes, setRevNotes] = React.useState(p.revisionNotes || '')
  const [showRev, setShowRev] = React.useState(false)
  const [internalNotes, setInternalNotes] = React.useState(p.notes || '')
  const keys = Object.keys(CHECKLIST_LABELS) as (keyof typeof CHECKLIST_LABELS)[]
  const done = keys.filter(k => p.checklist[k]).length
  const stale = daysSince(p.updatedAt) ?? 0

  function saveNotes(v: string) { setInternalNotes(v); updateProject(p.id, { notes: v }) }

  return (
    <div className="border border-[#27272a] rounded-xl overflow-hidden bg-[#111113]">
      <div className="px-4 py-3.5 border-b border-[#1f1f23]">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[12px] text-[#71717a] font-medium">{client?.name ?? '—'} · {client?.businessName ?? ''}</div>
            <div className="text-[15px] font-bold text-[#e4e4e7] mt-0.5">{p.name}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge status="Awaiting Approval" small />
            <span className={`text-[11px] ${stale > 3 ? 'text-[#fbbf24]' : 'text-[#52525b]'}`}>{stale}d in approval</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2.5">
        {/* Checklist progress */}
        <div>
          <div className="flex justify-between text-[12px] text-[#71717a] mb-1"><span>Checklist</span><span>{done}/{keys.length}</span></div>
          <div className="bg-[#27272a] rounded h-1">
            <div className="h-1 rounded transition-all" style={{ width: `${(done/keys.length)*100}%`, background: done===keys.length ? '#4ade80' : '#fbbf24' }} />
          </div>
        </div>

        {/* URLs */}
        <div className="flex flex-col gap-1">
          {p.vercelUrl && <div className="flex items-center gap-1.5 text-[12px]"><span className="text-[#52525b] min-w-[50px]">Vercel:</span><a href={p.vercelUrl} target="_blank" rel="noopener" className="text-[#fbbf24] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{p.vercelUrl}</a><CopyBtn value={p.vercelUrl} /></div>}
          {p.liveUrl && <div className="flex items-center gap-1.5 text-[12px]"><span className="text-[#52525b] min-w-[50px]">Live:</span><a href={p.liveUrl} target="_blank" rel="noopener" className="text-[#fbbf24] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{p.liveUrl}</a><CopyBtn value={p.liveUrl} /></div>}
        </div>

        {/* Prev revision notes */}
        {p.revisionNotes && !showRev && (
          <div className="bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.25)] rounded-md px-3 py-2 text-[12px] text-[#fb923c]">
            <strong>Previous revision:</strong> {p.revisionNotes}
          </div>
        )}

        {/* Internal notes */}
        <textarea value={internalNotes} onChange={e => saveNotes(e.target.value)} placeholder="Internal notes (autosaved)…" rows={2}
          className="w-full bg-[#18181b] border border-[#27272a] rounded-md px-2.5 py-1.5 text-[12px] text-[#e4e4e7] resize-none outline-none focus:border-[#fbbf24]" />

        {showRev && (
          <textarea value={revNotes} onChange={e => setRevNotes(e.target.value)} placeholder="Describe revisions needed…" rows={3} autoFocus
            className="w-full bg-[#18181b] border border-[#fbbf24] rounded-md px-2.5 py-1.5 text-[12px] text-[#e4e4e7] resize-none outline-none" />
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-[#1f1f23] flex gap-2 flex-wrap">
        <Btn variant="success" small onClick={onApprove}>✓ Approved</Btn>
        {!showRev
          ? <Btn variant="outline" small onClick={() => setShowRev(true)}>✎ Request Revision</Btn>
          : <>
              <Btn variant="danger" small onClick={() => { onRevision(revNotes); setShowRev(false) }}>Send Revision</Btn>
              <Btn variant="ghost" small onClick={() => setShowRev(false)}>Cancel</Btn>
            </>
        }
        <Btn variant="ghost" small onClick={onCopyMsg}>⎘ Copy Message</Btn>
      </div>
    </div>
  )
}

export default function ApprovalsView() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [confirm, setConfirm] = React.useState<{ msg: string; yes: () => void } | null>(null)
  const { toasts, toast, remove } = useToasts()

  function load() {
    setProjects(getProjects().filter(p => p.status === 'Awaiting Approval'))
    setClients(getClients())
  }
  React.useEffect(() => { load() }, [])

  function clientFor(clientId: string) { return clients.find(c => c.id === clientId) }

  function markApproved(p: Project) {
    setConfirm({ msg: `Mark "${p.name}" approved and move to Live?`, yes: () => {
      updateProject(p.id, { status: 'Live' }); toast('Moved to Live ✓'); setConfirm(null); load()
    }})
  }
  function requestRevision(p: Project, notes: string) {
    updateProject(p.id, { status: 'Revision Requested', revisionNotes: notes })
    toast('Revision requested'); load()
  }
  function copyMsg(p: Project) {
    const c = clientFor(p.clientId)
    const msg = `Hi ${c?.name ?? 'there'}, your landing page is ready for review. View it here: ${p.liveUrl || p.vercelUrl || '[URL]'}. Please let me know if you'd like any changes.`
    navigator.clipboard.writeText(msg); toast('Message copied!')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[#27272a] flex-shrink-0 flex items-center gap-3">
        <h1 className="m-0 text-[18px] font-bold text-[#e4e4e7] flex-1 tracking-tight">Approvals</h1>
        <span className="text-[13px] text-[#71717a]">{projects.length} awaiting review</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-16">
        {!projects.length
          ? <EmptyState icon="✅" title="No projects awaiting approval" subtitle="Move projects to 'Awaiting Approval' to see them here." />
          : <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
              {projects.map(p => (
                <ApprovalCard key={p.id} project={p} client={clientFor(p.clientId)}
                  onApprove={() => markApproved(p)}
                  onRevision={notes => requestRevision(p, notes)}
                  onCopyMsg={() => copyMsg(p)}
                  onRefresh={load}
                  toast={toast}
                />
              ))}
            </div>
        }
      </div>

      <ShortcutBar shortcuts={[{key:'Esc',label:'Close modal'}]} />
      {confirm && <Confirm message={confirm.msg} onConfirm={confirm.yes} onCancel={() => setConfirm(null)} danger={false} />}
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  )
}
