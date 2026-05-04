'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import { clsx } from 'clsx'
import { checkOverdueInvoices, getInvoices, getPref, setPref } from '@/lib/data'
import { useToasts, ToastContainer } from '@/components/ui'

const NAV = [
  { section: 'Main', items: [
    { id: 'dashboard',  href: '/',            label: 'Dashboard',    icon: '⊞' },
    { id: 'clients',    href: '/clients',     label: 'Clients',      icon: '👥' },
    { id: 'projects',   href: '/projects',    label: 'Projects',     icon: '📋' },
    { id: 'invoices',   href: '/invoices',    label: 'Invoices',     icon: '🧾' },
    { id: 'approvals',  href: '/approvals',   label: 'Approvals',    icon: '✅' },
  ]},
  { section: 'Insights', items: [
    { id: 'analytics',  href: '/analytics',   label: 'Analytics',    icon: '📈' },
  ]},
  { section: 'Tools', items: [
    { id: 'ai',         href: '/ai',          label: 'AI Assistant', icon: '✦' },
    { id: 'activity',   href: '/activity',    label: 'Activity Log', icon: '📋' },
  ]},
]

// Context for global toast
const ToastContext = React.createContext<((msg: string, type?: 'success'|'error'|'warn') => void)>(() => {})
export function useAppToast() { return React.useContext(ToastContext) }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { toasts, toast, remove } = useToasts()
  const [notifCount, setNotifCount] = React.useState(0)
  const [search, setSearch] = React.useState('')
  const [searchOpen, setSearchOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    checkOverdueInvoices()
    const overdue = getInvoices().filter(i => i.status === 'Overdue').length
    setNotifCount(overdue)
  }, [pathname])

  // Keyboard shortcuts
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (e.key === '/' && !inInput) { e.preventDefault(); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }
      if (e.key === 'Escape') { setSearchOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <ToastContext.Provider value={toast}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 flex flex-col h-screen overflow-y-auto border-r border-[rgba(255,255,255,0.06)]" style={{ background: '#0c0c0e' }}>
          {/* Logo */}
          <div className="px-5 pt-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-sm font-black text-[#09090b]" style={{ background: 'linear-gradient(135deg, #fbbf24, #fcd34d)' }}>C</div>
              <div>
                <div className="text-[#f4f4f5] font-extrabold text-[15px] tracking-tight">Cinema</div>
                <div className="text-[#52525b] text-[10px] uppercase tracking-widest">Agency OS</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3">
            {NAV.map(section => (
              <div key={section.section} className="mb-4">
                <div className="px-5 py-1 text-[10px] font-bold text-[#52525b] uppercase tracking-[0.08em]">{section.section}</div>
                {section.items.map(item => {
                  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                  return (
                    <Link key={item.id} href={item.href}
                      className={clsx(
                        'flex items-center gap-2.5 px-5 py-1.5 text-[13px] no-underline transition-colors border-l-2',
                        isActive
                          ? 'bg-[rgba(251,191,36,0.1)] border-[#fbbf24] text-[#f4f4f5] font-semibold'
                          : 'border-transparent text-[#71717a] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#a1a1aa]'
                      )}>
                      <span className="text-sm w-[18px] text-center">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.id === 'approvals' && notifCount > 0 && (
                        <span className="ml-auto bg-red-600 text-white rounded-full px-1.5 text-[10px] font-bold leading-4">{notifCount}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] text-[11px] text-[#52525b]">
            Cinema v1.0 · Local data
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="h-[52px] bg-[#111113] border-b border-[#27272a] flex items-center px-5 gap-3 flex-shrink-0 relative z-20">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <div onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
                className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 cursor-text text-[#52525b] text-[13px]">
                <span>⌕</span>
                <span>Search everything…</span>
                <kbd className="ml-auto bg-[#27272a] rounded px-1 text-[10px] text-[#71717a]">/</kbd>
              </div>
              {searchOpen && (
                <div className="absolute top-full left-0 right-0 bg-[#111113] border border-[#27272a] rounded-lg shadow-2xl z-50 mt-1 overflow-hidden">
                  <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                    onBlur={() => setTimeout(() => { setSearchOpen(false); setSearch('') }, 200)}
                    placeholder="Search clients, projects, invoices…"
                    className="w-full border-0 border-b border-[#27272a] px-4 py-3 text-[13px] bg-[#18181b] text-[#e4e4e7] placeholder-[#52525b] outline-none" />
                  <div className="px-4 py-3 text-[12px] text-[#52525b]">Press / to search</div>
                </div>
              )}
            </div>

            {/* Quick Add */}
            <Link href="/clients" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fbbf24] text-[#09090b] rounded-md text-[13px] font-semibold no-underline hover:bg-[#fcd34d] transition-colors">
              <span className="text-base leading-none">+</span> Quick Add
            </Link>

            {/* Notifications */}
            <Link href="/invoices" className="relative text-[#71717a] hover:text-[#a1a1aa] text-lg p-1.5 rounded-md no-underline transition-colors">
              🔔
              {notifCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-3.5 text-center text-[9px] font-bold leading-3.5">{notifCount}</span>
              )}
            </Link>

            <div className="text-[12px] text-[#52525b] font-medium whitespace-nowrap">{today}</div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            {children}
          </main>
        </div>
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </ToastContext.Provider>
  )
}
