'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import { clsx } from 'clsx'
import { checkOverdueInvoices, getInvoices, getClients, getProjects } from '@/lib/data'
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

const ToastContext = React.createContext<((msg: string, type?: 'success'|'error'|'warn') => void)>(() => {})
export function useAppToast() { return React.useContext(ToastContext) }

// ── Quick Add Dropdown ────────────────────────────────────────────────────────
function QuickAddMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const items = [
    { label: 'New Client',  icon: '👤', href: '/clients' },
    { label: 'New Project', icon: '📁', href: '/projects' },
    { label: 'New Invoice', icon: '🧾', href: '/invoices' },
  ]

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
          background: 'var(--accent)', color: '#09090b', border: 'none', borderRadius: 7,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Quick Add
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 300, minWidth: 180, padding: 4,
        }}>
          {items.map(item => (
            <button key={item.label}
              onClick={() => { setOpen(false); router.push(item.href) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, color: 'var(--fg-2)',
                borderRadius: 6, textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
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

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (e.key === '/' && !inInput) { e.preventDefault(); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }
      if (e.key === 'Escape') { setSearchOpen(false); setSearch('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Live search results
  const searchResults = React.useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    const results: { type: string; label: string; sub: string; href: string }[] = []
    if (typeof window === 'undefined') return results
    getClients().filter(c => !c.archived).forEach(c => {
      if ([c.name, c.businessName, c.email].some(f => (f || '').toLowerCase().includes(q)))
        results.push({ type: 'Client', label: c.name, sub: c.businessName || '', href: '/clients' })
    })
    getProjects().forEach(p => {
      if ((p.name || '').toLowerCase().includes(q))
        results.push({ type: 'Project', label: p.name, sub: p.status, href: '/projects' })
    })
    getInvoices().forEach(i => {
      if ((i.invoiceNumber || '').toLowerCase().includes(q))
        results.push({ type: 'Invoice', label: i.invoiceNumber, sub: '', href: '/invoices' })
    })
    return results.slice(0, 10)
  }, [search])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <ToastContext.Provider value={toast}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* ── Sidebar ── */}
        <aside id="cinema-sidebar" style={{
          width: 240, display: 'flex', flexDirection: 'column',
          flexShrink: 0, height: '100vh', overflowY: 'auto',
          background: 'var(--sb-bg)', borderRight: '1px solid var(--sb-border)',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--sb-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent), var(--accent-muted))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#09090b',
              }}>C</div>
              <div>
                <div style={{ color: 'var(--sb-active)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>Cinema</div>
                <div style={{ color: 'var(--sb-logo-sub)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Agency OS</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 0' }}>
            {NAV.map(section => (
              <div key={section.section} style={{ marginBottom: 16 }}>
                <div style={{
                  padding: '4px 20px', fontSize: 10, fontWeight: 700,
                  color: 'var(--sb-section)', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 2,
                }}>{section.section}</div>
                {section.items.map(item => {
                  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                  return (
                    <Link key={item.id} href={item.href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 20px', textDecoration: 'none',
                        background: isActive ? 'var(--accent-light)' : 'transparent',
                        borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                        color: isActive ? 'var(--sb-active)' : 'var(--sb-item)',
                        fontSize: 13, fontWeight: isActive ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
                      <span>{item.label}</span>
                      {item.id === 'approvals' && notifCount > 0 && (
                        <span style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>{notifCount}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--sb-border)', fontSize: 11, color: 'var(--sb-footer)' }}>
            Cinema v1.0 · Local data
          </div>
        </aside>

        {/* ── Main area ── */}
        <div id="cinema-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: 'var(--bg)' }}>

          {/* Header */}
          <header id="cinema-header" style={{
            height: 52, background: 'var(--bg-2)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 20px',
            gap: 12, flexShrink: 0, position: 'relative', zIndex: 200,
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
              <div
                onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-3)', border: '1px solid var(--border)',
                  borderRadius: 7, padding: '6px 12px', cursor: 'text',
                  color: 'var(--fg-3)', fontSize: 13,
                }}
              >
                <span>⌕</span>
                <span>Search everything…</span>
                <kbd style={{ marginLeft: 'auto', background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: 10, color: 'var(--fg-3)' }}>/</kbd>
              </div>

              {searchOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 300, overflow: 'hidden',
                }}>
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onBlur={() => setTimeout(() => { setSearchOpen(false); setSearch('') }, 200)}
                    placeholder="Search clients, projects, invoices…"
                    style={{
                      width: '100%', border: 'none', borderBottom: '1px solid var(--border)',
                      padding: '12px 16px', fontSize: 13, outline: 'none',
                      background: 'var(--bg-3)', color: 'var(--fg)',
                    }}
                  />
                  {searchResults.length > 0 ? (
                    <div>
                      {searchResults.map((r, i) => (
                        <div key={i}
                          onClick={() => { router.push(r.href); setSearchOpen(false); setSearch('') }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 16px', cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: 10, background: 'var(--bg-4)', color: 'var(--fg-3)', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>{r.type}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{r.label}</span>
                          {r.sub && <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{r.sub}</span>}
                        </div>
                      ))}
                    </div>
                  ) : search.trim() ? (
                    <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--fg-3)' }}>No results for "{search}"</div>
                  ) : (
                    <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--fg-4)' }}>Start typing to search clients, projects, invoices…</div>
                  )}
                </div>
              )}
            </div>

            <QuickAddMenu />

            {/* Notifications */}
            <Link href="/invoices" style={{ position: 'relative', color: 'var(--fg-3)', fontSize: 18, padding: 6, borderRadius: 6, textDecoration: 'none' }} title="Overdue invoices">
              🔔
              {notifCount > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, background: '#dc2626', color: '#fff', borderRadius: 10, padding: '0 4px', fontSize: 9, fontWeight: 700, minWidth: 14, textAlign: 'center', lineHeight: '14px' }}>{notifCount}</span>
              )}
            </Link>

            <div style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{today}</div>
          </header>

          <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
        </div>
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </ToastContext.Provider>
  )
}
