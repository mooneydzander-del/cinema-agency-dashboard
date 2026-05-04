'use client'

import React from 'react'
import { clsx } from 'clsx'

// ── Status colors ─────────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Active:               { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  Pending:              { bg: 'rgba(234,179,8,0.12)',   color: '#facc15', border: 'rgba(234,179,8,0.25)' },
  Paused:               { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  Churned:              { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  Paid:                 { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  Unpaid:               { bg: 'rgba(234,179,8,0.12)',   color: '#facc15', border: 'rgba(234,179,8,0.25)' },
  Overdue:              { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  New:                  { bg: 'rgba(82,82,91,0.2)',     color: '#a1a1aa', border: 'rgba(82,82,91,0.4)' },
  'In Progress':        { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  'Awaiting Approval':  { bg: 'rgba(234,179,8,0.12)',   color: '#facc15', border: 'rgba(234,179,8,0.25)' },
  'Revision Requested': { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  Approved:             { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  Live:                 { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.25)' },
  'On Hold':            { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  Cancelled:            { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  Awaiting:             { bg: 'rgba(234,179,8,0.12)',   color: '#facc15', border: 'rgba(234,179,8,0.25)' },
  '50% Paid':           { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  'Paid in Full':       { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  'Launch Package':     { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  'Full Automation':    { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  'Setup 50%':          { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  'Setup Full':         { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  Monthly:              { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  Custom:               { bg: 'rgba(82,82,91,0.2)',     color: '#a1a1aa', border: 'rgba(82,82,91,0.4)' },
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ status, small }: { status: string; small?: boolean }) {
  const c = STATUS_COLORS[status] ?? { bg: 'rgba(82,82,91,0.2)', color: '#a1a1aa', border: 'rgba(82,82,91,0.4)' }
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
      className={clsx('inline-block rounded font-semibold whitespace-nowrap tracking-tight', small ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[11px]')}>
      {status}
    </span>
  )
}

// ── Health Dot ────────────────────────────────────────────────────────────────
export function HealthDot({ score }: { score: number }) {
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171'
  return <span title={`Health: ${score}`} style={{ background: color }} className="inline-block w-2 h-2 rounded-full flex-shrink-0" />
}

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'

export function Btn({
  variant = 'primary', onClick, children, disabled, small, className, type = 'button',
}: {
  variant?: BtnVariant
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
  small?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}) {
  const base = 'inline-flex items-center gap-1.5 rounded font-medium transition-colors cursor-pointer border-0 font-sans'
  const size = small ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]'
  const variants: Record<BtnVariant, string> = {
    primary:   'bg-[#fbbf24] text-[#09090b] font-semibold hover:bg-[#fcd34d]',
    secondary: 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a] hover:bg-[#1f1f23]',
    ghost:     'bg-transparent text-[#71717a] border border-[#27272a] hover:bg-[#18181b]',
    danger:    'bg-[#dc2626] text-white hover:bg-[#b91c1c]',
    success:   'bg-[#16a34a] text-white hover:bg-[#15803d]',
    outline:   'bg-transparent text-[#a1a1aa] border border-[#3f3f46] hover:bg-[#18181b]',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={clsx(base, size, variants[variant], disabled && 'opacity-40 cursor-not-allowed', className)}>
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1.5 text-[13px] text-[#e4e4e7] placeholder-[#52525b] outline-none focus:border-[#fbbf24] transition-colors'

export function Input({
  value, onChange, placeholder, type = 'text', onKeyDown, className,
}: {
  value: string | number | undefined
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  onKeyDown?: React.KeyboardEventHandler
  className?: string
}) {
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} onKeyDown={onKeyDown}
      className={clsx(inputCls, className)} />
  )
}

export function Select({
  value, onChange, options,
}: {
  value: string | undefined
  onChange: (v: string) => void
  options: (string | { value: string; label: string })[]
}) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)}
      className={clsx(inputCls, 'appearance-auto')}>
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  )
}

export function Textarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className={clsx(inputCls, 'resize-y leading-relaxed')} />
  )
}

export function Field({
  label, children, required,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-medium text-[#71717a] tracking-wide">
        {label}{required && <span className="text-red-400"> *</span>}
      </label>
      {children}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({
  title, onClose, children, width = 560,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: number
}) {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width, maxWidth: '95vw' }}
        className="bg-[#111113] border border-[#27272a] rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] flex-shrink-0">
          <h2 className="text-[15px] font-semibold text-[#e4e4e7] m-0">{title}</h2>
          <button onClick={onClose} className="text-[#71717a] hover:text-[#a1a1aa] text-lg leading-none bg-transparent border-0 cursor-pointer px-1">✕</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// ── Confirm ───────────────────────────────────────────────────────────────────
export function Confirm({
  message, onConfirm, onCancel, danger = true,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <Modal title="Confirm" onClose={onCancel} width={380}>
      <p className="text-[14px] text-[#a1a1aa] mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Btn>
      </div>
    </Modal>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex border-b border-[#27272a]">
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)}
          className={clsx('px-4 py-2 text-[13px] bg-transparent border-0 cursor-pointer transition-colors -mb-px border-b-2',
            active === t ? 'text-[#e4e4e7] font-semibold border-[#fbbf24]' : 'text-[#71717a] font-normal border-transparent hover:text-[#a1a1aa]'
          )}>
          {t}
        </button>
      ))}
    </div>
  )
}

// ── Filter Chips ──────────────────────────────────────────────────────────────
export function FilterChips({
  options, active, onChange,
}: {
  options: string[]
  active: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(o => {
        const isActive = active === o
        return (
          <button key={o} onClick={() => onChange(isActive ? '' : o)}
            className={clsx('px-2.5 py-0.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer',
              isActive ? 'bg-[#fbbf24] border-[#fbbf24] text-[#09090b]' : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:text-[#a1a1aa]'
            )}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

// ── Search Input ──────────────────────────────────────────────────────────────
export function SearchInput({
  value, onChange, placeholder = 'Search…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#52525b] text-[13px]">⌕</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={clsx(inputCls, 'pl-7 w-52')} />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon = '📭', title, subtitle, action,
}: {
  icon?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 gap-3">
      <div className="text-4xl opacity-30">{icon}</div>
      <div className="text-[15px] font-semibold text-[#a1a1aa]">{title}</div>
      {subtitle && <div className="text-[13px] text-center max-w-xs text-[#52525b]">{subtitle}</div>}
      {action}
    </div>
  )
}

// ── Copy Button ───────────────────────────────────────────────────────────────
export function CopyBtn({ value }: { value: string | undefined }) {
  const [copied, setCopied] = React.useState(false)
  if (!value) return null
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="bg-transparent border-0 cursor-pointer text-[11px] px-0.5 text-[#52525b] hover:text-[#a1a1aa]">
      {copied ? '✓' : '⎘'}
    </button>
  )
}

// ── Inline Edit ───────────────────────────────────────────────────────────────
export function InlineEdit({
  value, onSave, type = 'text', options,
}: {
  value: string | number | undefined
  onSave: (v: string) => void
  type?: string
  options?: string[]
}) {
  const [editing, setEditing] = React.useState(false)
  const [val, setVal] = React.useState(String(value ?? ''))
  const ref = React.useRef<HTMLInputElement & HTMLSelectElement>(null)

  React.useEffect(() => { setVal(String(value ?? '')) }, [value])
  React.useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  function commit() { setEditing(false); if (val !== String(value ?? '')) onSave(val) }
  function cancel() { setEditing(false); setVal(String(value ?? '')) }

  if (!editing) {
    return (
      <span onClick={() => setEditing(true)}
        className="inline-block min-w-[2.5rem] rounded px-0.5 py-px cursor-text inline-edit-trigger text-[#a1a1aa]">
        {value ?? <span className="text-[#52525b]">—</span>}
      </span>
    )
  }
  if (options) {
    return (
      <select ref={ref as React.RefObject<HTMLSelectElement>} value={val}
        onChange={e => setVal(e.target.value)} onBlur={commit}
        className="text-[13px] border border-[#fbbf24] rounded px-1 py-0.5 outline-none bg-[#18181b] text-[#e4e4e7]">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  return (
    <input ref={ref as React.RefObject<HTMLInputElement>} type={type} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
      className="text-[13px] border border-[#fbbf24] rounded px-1.5 py-0.5 outline-none w-full min-w-[5rem] bg-[#18181b] text-[#e4e4e7]" />
  )
}

// ── Bulk Bar ──────────────────────────────────────────────────────────────────
export function BulkBar({
  count, onClear, actions,
}: {
  count: number
  onClear: () => void
  actions: { label: string; onClick: () => void }[]
}) {
  if (!count) return null
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#1f1f23] border border-[#3f3f46] rounded-lg mb-2">
      <span className="text-[#e4e4e7] text-[13px] font-medium">{count} selected</span>
      <div className="flex-1 flex gap-2">
        {actions.map((a, i) => (
          <Btn key={i} variant="ghost" small onClick={a.onClick}>{a.label}</Btn>
        ))}
      </div>
      <button onClick={onClear} className="bg-transparent border-0 text-[#71717a] cursor-pointer text-base">✕</button>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export interface Toast { id: number; msg: string; type: 'success' | 'error' | 'warn' }

export function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-14 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={clsx(
          'flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium border pointer-events-auto min-w-[13rem] max-w-[21rem] animate-fade-in-up',
          t.type === 'error' ? 'bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.25)] text-[#f87171]'
            : t.type === 'warn' ? 'bg-[rgba(234,179,8,0.12)] border-[rgba(234,179,8,0.25)] text-[#facc15]'
            : 'bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.25)] text-[#4ade80]'
        )}>
          <span>{t.type === 'error' ? '✕' : t.type === 'warn' ? '⚠' : '✓'}</span>
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => remove(t.id)} className="bg-transparent border-0 cursor-pointer opacity-50 text-sm">✕</button>
        </div>
      ))}
    </div>
  )
}

export function useToasts() {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const toast = React.useCallback((msg: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }, [])
  const remove = React.useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), [])
  return { toasts, toast, remove }
}

// ── Checklist ─────────────────────────────────────────────────────────────────
import { CHECKLIST_LABELS } from '@/lib/types'
import type { ProjectChecklist } from '@/lib/types'

export function Checklist({ checklist, onChange }: { checklist: ProjectChecklist; onChange: (cl: ProjectChecklist) => void }) {
  const keys = Object.keys(CHECKLIST_LABELS) as (keyof ProjectChecklist)[]
  const done = keys.filter(k => checklist[k]).length
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider">Checklist</span>
        <span className="text-[12px] text-[#71717a]">{done}/{keys.length}</span>
      </div>
      <div className="bg-[#27272a] rounded h-1 mb-3">
        <div className="h-1 rounded transition-all duration-300"
          style={{ width: `${(done / keys.length) * 100}%`, background: done === keys.length ? '#4ade80' : '#fbbf24' }} />
      </div>
      <div className="flex flex-col gap-1">
        {keys.map(k => (
          <label key={k} className={clsx('flex items-center gap-2 cursor-pointer text-[13px]', checklist[k] ? 'text-[#52525b] line-through' : 'text-[#e4e4e7]')}>
            <input type="checkbox" checked={!!checklist[k]} onChange={e => onChange({ ...checklist, [k]: e.target.checked })}
              className="accent-[#fbbf24]" />
            {CHECKLIST_LABELS[k]}
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Shortcut Bar ──────────────────────────────────────────────────────────────
export function ShortcutBar({ shortcuts }: { shortcuts: { key: string; label: string }[] }) {
  return (
    <div className="fixed bottom-0 left-60 right-0 bg-[#111113] border-t border-[#27272a] px-4 py-1 flex gap-4 items-center z-10">
      {shortcuts.map((s, i) => (
        <span key={i} className="flex items-center gap-1 text-[11px] text-[#52525b]">
          <kbd className="bg-[#1f1f23] border border-[#27272a] rounded px-1.5 py-px text-[10px] font-mono text-[#71717a]">{s.key}</kbd>
          <span>{s.label}</span>
        </span>
      ))}
    </div>
  )
}
