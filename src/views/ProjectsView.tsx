'use client'

import React from 'react'
import {
  getProjects, getClients, createProject, updateProject, deleteProject,
  duplicateProject, fmtCurrency, fmtDate, daysSince, getPref, setPref,
} from '@/lib/data'
import type { Project, Client } from '@/lib/types'
import { PROJECT_STATUSES, CHECKLIST_LABELS } from '@/lib/types'
import {
  Badge, Btn, Field, Input, Select, Textarea, Modal, Confirm,
  FilterChips, SearchInput, EmptyState, ShortcutBar, useToasts, ToastContainer,
  Tabs, CopyBtn, Checklist, InlineEdit,
} from '@/components/ui'
import { clsx } from 'clsx'

const KANBAN_COLS = PROJECT_STATUSES

// ── Kanban Card ───────────────────────────────────────────────────────────────
function KanbanCard({ project: p, clientName, onOpen, onDragStart }: {
  project: Project; clientName: string; onOpen: () => void; onDragStart: () => void
}) {
  const keys = Object.keys(CHECKLIST_LABELS) as (keyof typeof CHECKLIST_LABELS)[]
  const done = keys.filter(k => p.checklist[k]).length
  const stale = daysSince(p.updatedAt) ?? 0
  const isOverdue = p.dueDate && new Date(p.dueDate) < new Date() && !['Live','Cancelled'].includes(p.status)

  return (
    <div draggable onDragStart={onDragStart} onClick={onOpen}
      className={clsx('bg-[#18181b] rounded-lg p-3 cursor-pointer border transition-colors hover:border-[#3f3f46]',
        isOverdue ? 'border-[rgba(239,68,68,0.3)]' : 'border-[#27272a]')}>
      <div className="text-[11px] text-[#71717a] font-medium mb-0.5">{clientName}</div>
      <div className="text-[13px] font-semibold text-[#e4e4e7] mb-2 leading-snug">{p.name}</div>
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[#52525b]">{done}/10 ✓</span>
        <span className={clsx('text-[11px]', stale > 7 ? 'text-[#fbbf24]' : 'text-[#52525b]')}>{stale}d</span>
      </div>
      {p.dueDate && <div className={clsx('text-[11px] mt-1', isOverdue ? 'text-[#f87171]' : 'text-[#52525b]')}>Due {fmtDate(p.dueDate)}</div>}
    </div>
  )
}

// ── Project Detail Modal ──────────────────────────────────────────────────────
function ProjectDetailModal({ projectId, clients, onClose, onRefresh, toast }: {
  projectId: string; clients: Client[]; onClose: () => void
  onRefresh: () => void; toast: (m: string, t?: 'success'|'error'|'warn') => void
}) {
  const [project, setProject] = React.useState<Project | null>(null)
  const [tab, setTab] = React.useState('Details')

  function reload() { setProject(getProjects().find(p => p.id === projectId) ?? null) }
  React.useEffect(() => { reload() }, [projectId])

  function save(updates: Partial<Project>) { updateProject(projectId, updates); reload(); onRefresh(); toast('Saved') }

  if (!project) return null
  const client = clients.find(c => c.id === project.clientId)

  return (
    <Modal title={project.name} onClose={onClose} width={680}>
      <div className="flex items-center gap-2 mb-4">
        <Badge status={project.status} />
        {client && <span className="text-[13px] text-[#71717a]">for <strong className="text-[#a1a1aa]">{client.name}</strong></span>}
      </div>
      <Tabs tabs={['Details','Checklist','Timeline','Notes']} active={tab} onChange={setTab} />
      <div className="pt-4">
        {tab === 'Details' && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Status"><Select value={project.status} onChange={v => save({ status: v as Project['status'] })} options={PROJECT_STATUSES} /></Field>
            <Field label="Due Date"><Input value={project.dueDate} onChange={v => save({ dueDate: v })} type="date" /></Field>
            <Field label="Vercel URL">
              <div className="flex items-center gap-1"><Input value={project.vercelUrl} onChange={v => save({ vercelUrl: v })} /><CopyBtn value={project.vercelUrl} /></div>
            </Field>
            <Field label="Live URL">
              <div className="flex items-center gap-1"><Input value={project.liveUrl} onChange={v => save({ liveUrl: v })} /><CopyBtn value={project.liveUrl} /></div>
            </Field>
            {project.status === 'Revision Requested' && (
              <div className="col-span-2">
                <Field label="Revision Notes"><Textarea value={project.revisionNotes} onChange={v => save({ revisionNotes: v })} placeholder="Describe revisions…" /></Field>
              </div>
            )}
            <div className="col-span-2"><Field label="Description"><Textarea value={project.description} onChange={v => save({ description: v })} /></Field></div>
          </div>
        )}
        {tab === 'Checklist' && <Checklist checklist={project.checklist} onChange={cl => save({ checklist: cl })} />}
        {tab === 'Timeline' && (
          <div className="flex flex-col gap-2">
            {!(project.timeline?.length) ? <EmptyState icon="📅" title="No timeline entries yet" /> : project.timeline.map(e => (
              <div key={e.id} className="flex items-center gap-2.5 px-3 py-1.5 bg-[#18181b] rounded-lg text-[12px]">
                <span className="text-[#52525b] min-w-[90px]">{fmtDate(e.timestamp)}</span>
                <Badge status={e.from} small /><span className="text-[#52525b]">→</span><Badge status={e.to} small />
              </div>
            ))}
          </div>
        )}
        {tab === 'Notes' && <Textarea value={project.notes} onChange={v => save({ notes: v })} rows={8} placeholder="Notes…" />}
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#27272a]">
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
        <Btn variant="primary" onClick={() => { save({ status: 'Awaiting Approval' }); toast('Moved to Approvals'); onClose() }}>Move to Approvals</Btn>
      </div>
    </Modal>
  )
}

// ── Add/Edit Project Modal ────────────────────────────────────────────────────
function ProjectModal({ project, clients, onClose, onSave, toast }: {
  project?: Project | null; clients: Client[]; onClose: () => void
  onSave: () => void; toast: (m: string, t?: 'success'|'error'|'warn') => void
}) {
  const isEdit = !!project
  const [form, setForm] = React.useState<Partial<Project>>(project ?? { name: '', clientId: '', status: 'New', dueDate: '', vercelUrl: '', liveUrl: '', description: '' })
  function set(k: keyof Project, v: unknown) { setForm(f => ({ ...f, [k]: v })) }
  function submit() {
    if (!form.name) { toast('Name required','error'); return }
    if (isEdit && project) { updateProject(project.id, form); toast('Updated') }
    else { createProject(form); toast('Created') }
    onSave(); onClose()
  }
  return (
    <Modal title={isEdit ? 'Edit Project' : 'New Project'} onClose={onClose} width={560}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2"><Field label="Project Name" required><Input value={form.name} onChange={v => set('name', v)} /></Field></div>
        <Field label="Client">
          <select value={form.clientId ?? ''} onChange={e => set('clientId', e.target.value)} className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1.5 text-[13px] text-[#e4e4e7] outline-none focus:border-[#fbbf24] appearance-auto">
            <option value="">Select client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Status"><Select value={form.status} onChange={v => set('status', v)} options={PROJECT_STATUSES} /></Field>
        <Field label="Due Date"><Input value={form.dueDate} onChange={v => set('dueDate', v)} type="date" /></Field>
        <Field label="Vercel URL"><Input value={form.vercelUrl} onChange={v => set('vercelUrl', v)} /></Field>
        <Field label="Live URL"><Input value={form.liveUrl} onChange={v => set('liveUrl', v)} /></Field>
        <div className="col-span-2"><Field label="Description"><Textarea value={form.description} onChange={v => set('description', v)} rows={2} /></Field></div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#27272a]">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit}>{isEdit ? 'Save' : 'Create Project'}</Btn>
      </div>
    </Modal>
  )
}

// ── Projects View ─────────────────────────────────────────────────────────────
export default function ProjectsView() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [view, setView] = React.useState<'kanban'|'list'>(() => getPref('projectsView','kanban') as 'kanban'|'list')
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('All')
  const [showModal, setShowModal] = React.useState(false)
  const [editProject, setEditProject] = React.useState<Project | null>(null)
  const [detailProject, setDetailProject] = React.useState<Project | null>(null)
  const [confirm, setConfirm] = React.useState<{ msg: string; yes: () => void } | null>(null)
  const [dragId, setDragId] = React.useState<string | null>(null)
  const { toasts, toast, remove } = useToasts()

  function load() { setProjects(getProjects()); setClients(getClients()) }
  React.useEffect(() => { load() }, [])

  function clientName(id: string) { return clients.find(c => c.id === id)?.name ?? '—' }

  const filtered = React.useMemo(() => {
    let list = projects
    if (statusFilter !== 'All') list = list.filter(p => p.status === statusFilter)
    if (search) { const q = search.toLowerCase(); list = list.filter(p => [p.name, clientName(p.clientId)].some(f => f.toLowerCase().includes(q))) }
    return list
  }, [projects, statusFilter, search, clients])

  function switchView(v: 'kanban'|'list') { setView(v); setPref('projectsView', v) }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[#27272a] flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-2.5">
          <h1 className="m-0 text-[18px] font-bold text-[#e4e4e7] flex-1 tracking-tight">Projects</h1>
          <SearchInput value={search} onChange={setSearch} />
          <div className="flex border border-[#27272a] rounded-md overflow-hidden">
            {(['kanban','list'] as const).map(v => (
              <button key={v} onClick={() => switchView(v)}
                className={clsx('px-3 py-1.5 text-[12px] font-medium border-0 cursor-pointer transition-colors',
                  view === v ? 'bg-[#fbbf24] text-[#09090b]' : 'bg-[#18181b] text-[#71717a] hover:text-[#a1a1aa]')}>
                {v === 'kanban' ? '⬛ Kanban' : '☰ List'}
              </button>
            ))}
          </div>
          <Btn variant="primary" onClick={() => { setEditProject(null); setShowModal(true) }}>+ Add Project</Btn>
        </div>
        <FilterChips options={['All',...KANBAN_COLS]} active={statusFilter} onChange={v => setStatusFilter(v||'All')} />
      </div>

      <div className={clsx('flex-1 px-5 pb-16', view === 'kanban' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto')}>
        {view === 'kanban' ? (
          <div className="flex gap-3 h-full pt-4 min-w-max">
            {KANBAN_COLS.map(col => {
              const colProjects = filtered.filter(p => p.status === col)
              return (
                <div key={col} className="w-52 flex-shrink-0 flex flex-col"
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => { if (dragId) { updateProject(dragId, { status: col }); toast(`Moved to ${col}`); setDragId(null); load() } }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider">{col}</span>
                    <span className="bg-[#27272a] text-[#71717a] rounded-full px-2 text-[11px] font-semibold">{colProjects.length}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-2 min-h-[60px] p-2 bg-[#111113] rounded-lg border border-dashed border-[#27272a] overflow-y-auto">
                    {colProjects.map(p => (
                      <KanbanCard key={p.id} project={p} clientName={clientName(p.clientId)}
                        onOpen={() => setDetailProject(p)} onDragStart={() => setDragId(p.id)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <table className="cinema-table mt-3">
            <thead>
              <tr>
                <th>Project</th><th>Client</th><th>Status</th><th>Due Date</th><th>Updated</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><button onClick={() => setDetailProject(p)} className="bg-transparent border-0 cursor-pointer text-[#fbbf24] font-semibold underline text-[13px] p-0">{p.name || '—'}</button></td>
                  <td>{clientName(p.clientId)}</td>
                  <td><Badge status={p.status} small /></td>
                  <td className={p.dueDate && new Date(p.dueDate) < new Date() ? 'text-[#f87171]' : ''}>{fmtDate(p.dueDate)}</td>
                  <td className="text-[#52525b] text-[12px]">{fmtDate(p.updatedAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <Btn small variant="ghost" onClick={() => { setEditProject(p); setShowModal(true) }}>Edit</Btn>
                      <Btn small variant="ghost" onClick={() => { duplicateProject(p.id); load(); toast('Duplicated') }}>Dup</Btn>
                      <Btn small variant="ghost" onClick={() => setConfirm({ msg: `Delete ${p.name}?`, yes: () => { deleteProject(p.id); load(); setConfirm(null); toast('Deleted','warn') } })} className="text-red-400">Del</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!filtered.length && <EmptyState icon="📋" title="No projects" action={<Btn onClick={() => setShowModal(true)}>+ Add Project</Btn>} />}
      </div>

      <ShortcutBar shortcuts={[{key:'N',label:'New project'},{key:'/',label:'Search'}]} />
      {showModal && <ProjectModal project={editProject} clients={clients} onClose={() => setShowModal(false)} onSave={load} toast={toast} />}
      {detailProject && <ProjectDetailModal projectId={detailProject.id} clients={clients} onClose={() => setDetailProject(null)} onRefresh={load} toast={toast} />}
      {confirm && <Confirm message={confirm.msg} onConfirm={confirm.yes} onCancel={() => setConfirm(null)} />}
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  )
}
