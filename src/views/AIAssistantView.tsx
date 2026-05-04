'use client'

import React from 'react'
import {
  getClients, getProjects, getInvoices, getActivityLog,
  createClient, updateClient, createProject, updateProject, markInvoicePaid,
  createInvoice, nextInvoiceNumber, uid,
} from '@/lib/data'
import { Btn, useToasts, ToastContainer } from '@/components/ui'

interface Message { role: 'user'|'assistant'; content: string; commands?: Command[]; error?: boolean; ts: number }
interface Command { type: string; payload: Record<string,unknown> }

const SUGGESTIONS = [
  "Which clients haven't paid their setup fee?",
  "What's my current MRR?",
  "List all overdue invoices",
  "Which projects are stuck?",
]

function buildSystemPrompt(): string {
  const state = JSON.stringify({
    clients: getClients(),
    projects: getProjects(),
    invoices: getInvoices(),
    activityLog: getActivityLog().slice(0, 30),
  })
  return `You are the Cinema Agency operations assistant. You manage all client, project, invoice, and approval data for this landing page agency. You have full read and write access to all records.

Current dashboard state: ${state}

Always respond with valid JSON in this exact format:
{
  "message": "Natural language response",
  "commands": []
}

Available commands: ADD_CLIENT, UPDATE_CLIENT, ADD_PROJECT, UPDATE_PROJECT, MOVE_PROJECT, MOVE_TO_APPROVALS, MARK_INVOICE_PAID, CREATE_INVOICE, MARK_SETUP_FEE_PAID, UPDATE_SUBSCRIPTION, ADD_NOTE, PIN_CLIENT, ARCHIVE_CLIENT

Each command: { "type": "COMMAND_TYPE", "payload": { ...fields } }
For UPDATE_CLIENT/UPDATE_PROJECT: include id or name in payload plus fields to update.
For MARK_SETUP_FEE_PAID: payload { clientId or name, level: "50%" | "full" }
For UPDATE_SUBSCRIPTION: payload { clientId or name, status: "Active"|"Pending"|"Paused"|"Churned" }`
}

async function executeCommands(commands: Command[]): Promise<number> {
  const clients = getClients()
  const projects = getProjects()
  const invoices = getInvoices()

  function findClient(p: Record<string,unknown>) {
    if (p.id) return clients.find(c => c.id === p.id)
    if (p.clientId) return clients.find(c => c.id === p.clientId)
    if (p.name) return clients.find(c => c.name.toLowerCase().includes(String(p.name).toLowerCase()))
    if (p.clientName) return clients.find(c => c.name.toLowerCase().includes(String(p.clientName).toLowerCase()))
    return null
  }
  function findProject(p: Record<string,unknown>) {
    if (p.id) return projects.find(x => x.id === p.id)
    if (p.name) return projects.find(x => x.name.toLowerCase().includes(String(p.name).toLowerCase()))
    return null
  }

  let done = 0
  for (const cmd of commands) {
    const p = cmd.payload ?? {}
    try {
      switch (cmd.type) {
        case 'ADD_CLIENT': createClient(p as Parameters<typeof createClient>[0]); done++; break
        case 'UPDATE_CLIENT': { const c = findClient(p); if (c) { updateClient(c.id, p as Parameters<typeof updateClient>[1]); done++ } break }
        case 'ADD_PROJECT': { const cId = findClient(p)?.id ?? String(p.clientId ?? ''); createProject({ ...p as Parameters<typeof createProject>[0], clientId: cId }); done++; break }
        case 'UPDATE_PROJECT': case 'MOVE_PROJECT': { const proj = findProject(p); if (proj) { updateProject(proj.id, p as Parameters<typeof updateProject>[1]); done++ } break }
        case 'MOVE_TO_APPROVALS': { const proj = findProject(p); if (proj) { updateProject(proj.id, { status: 'Awaiting Approval' }); done++ } break }
        case 'MARK_INVOICE_PAID': {
          const inv = p.invoiceNumber ? invoices.find(i => i.invoiceNumber === p.invoiceNumber) : invoices.find(i => i.clientId === findClient(p)?.id && i.status !== 'Paid')
          if (inv) { markInvoicePaid(inv.id); done++ }; break
        }
        case 'CREATE_INVOICE': { const cId = findClient(p)?.id ?? String(p.clientId ?? ''); if (cId) { createInvoice({ ...p as Parameters<typeof createInvoice>[0], clientId: cId }); done++ } break }
        case 'MARK_SETUP_FEE_PAID': { const c = findClient(p); if (c) { const upd = p.level === 'full' ? { setupFeePaid: c.setupFeeTotal, setupFeeStatus: 'Paid in Full' as const } : { setupFeePaid: c.setupFeeTotal/2, setupFeeStatus: '50% Paid' as const }; updateClient(c.id, upd); done++ } break }
        case 'UPDATE_SUBSCRIPTION': { const c = findClient(p); if (c) { updateClient(c.id, { subscriptionStatus: p.status as 'Active'|'Pending'|'Paused'|'Churned' }); done++ } break }
        case 'ADD_NOTE': {
          if (p.entityType === 'client') { const c = findClient(p); if (c) { updateClient(c.id, { notes: (c.notes ? c.notes+'\n' : '') + String(p.note ?? '') }); done++ } }
          else { const proj = findProject(p); if (proj) { updateProject(proj.id, { notes: (proj.notes ? proj.notes+'\n' : '') + String(p.note ?? '') }); done++ } }
          break
        }
        case 'PIN_CLIENT': { const c = findClient(p); if (c) { updateClient(c.id, { pinned: p.pinned !== false }); done++ } break }
        case 'ARCHIVE_CLIENT': { const c = findClient(p); if (c) { updateClient(c.id, { archived: true }); done++ } break }
      }
    } catch (e) { console.error('Command error', cmd, e) }
  }
  return done
}

export default function AIAssistantView() {
  const [messages, setMessages] = React.useState<Message[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('cinema_ai_messages') || '[]') } catch { return [] }
  })
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { toasts, toast, remove } = useToasts()

  React.useEffect(() => {
    try { localStorage.setItem('cinema_ai_messages', JSON.stringify(messages)) } catch {}
    if (bottomRef.current) bottomRef.current.scrollTop = bottomRef.current.scrollHeight
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() }
    setMessages(p => [...p, userMsg])
    setLoading(true)

    try {
      // Call Anthropic API
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.slice(-10), userMsg].map(m => ({ role: m.role, content: m.content })),
          system: buildSystemPrompt(),
        }),
      })
      const { content } = await res.json()
      let parsed: { message: string; commands?: Command[] }
      try { const match = content.match(/\{[\s\S]*\}/); parsed = match ? JSON.parse(match[0]) : { message: content, commands: [] } }
      catch { parsed = { message: content, commands: [] } }

      if (parsed.commands?.length) {
        const count = await executeCommands(parsed.commands)
        if (count > 0) toast(`AI executed ${count} action${count>1?'s':''}`)
      }
      setMessages(p => [...p, { role: 'assistant', content: parsed.message || content, commands: parsed.commands, ts: Date.now() }])
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Request failed'
      setMessages(p => [...p, { role: 'assistant', content: `Error: ${err}`, error: true, ts: Date.now() }])
      toast('AI request failed', 'error')
    } finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 50) }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[#27272a] flex-shrink-0 flex items-center gap-3">
        <h1 className="m-0 text-[18px] font-bold text-[#e4e4e7] flex-1 tracking-tight">AI Assistant</h1>
        <Btn variant="ghost" small onClick={() => { setMessages([]); localStorage.removeItem('cinema_ai_messages') }}>Clear chat</Btn>
      </div>

      <div ref={bottomRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="text-3xl text-[#fbbf24]">✦</div>
            <div className="text-[15px] font-semibold text-[#a1a1aa]">Cinema AI Assistant</div>
            <div className="text-[13px] text-[#71717a] text-center max-w-sm">Full access to your clients, projects, invoices, and activity log. Ask anything or give commands.</div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-full text-[12px] text-[#a1a1aa] cursor-pointer hover:border-[#3f3f46]">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1 ${m.role==='user'?'items-end':'items-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
              m.role==='user' ? 'bg-[#fbbf24] text-[#09090b] rounded-br-sm'
              : m.error ? 'bg-[rgba(239,68,68,0.12)] text-[#f87171] border border-[rgba(239,68,68,0.25)] rounded-bl-sm'
              : 'bg-[#18181b] text-[#e4e4e7] border border-[#27272a] rounded-bl-sm'
            }`}>
              {m.content}
              {m.commands && m.commands.length > 0 && (
                <div className={`mt-2 pt-2 border-t ${m.role==='user'?'border-[rgba(0,0,0,0.2)]':'border-[#27272a]'}`}>
                  <div className="text-[11px] opacity-60 mb-1">Executed {m.commands.length} action{m.commands.length>1?'s':''}:</div>
                  {m.commands.map((c, ci) => <div key={ci} className="text-[11px] opacity-70 font-mono">→ {c.type}</div>)}
                </div>
              )}
            </div>
            <div className="text-[10px] text-[#52525b]">{m.role==='user'?'You':'Cinema AI'} · {new Date(m.ts).toLocaleTimeString()}</div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" style={{ animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}
            </div>
            <span className="text-[12px] text-[#52525b]">Thinking…</span>
          </div>
        )}
      </div>

      <div className="px-5 py-3 pb-16 border-t border-[#27272a] flex-shrink-0">
        <div className="flex gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask anything or give a command… (Enter to send)"
            disabled={loading}
            className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2.5 text-[13px] text-[#e4e4e7] placeholder-[#52525b] outline-none focus:border-[#fbbf24] transition-colors disabled:opacity-50" />
          <Btn variant="primary" onClick={send} disabled={loading || !input.trim()}>{loading ? '…' : 'Send'}</Btn>
        </div>
      </div>
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  )
}
