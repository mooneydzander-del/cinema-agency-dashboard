'use client'

import React from 'react'
import { getActivityLog, exportCSV } from '@/lib/data'
import type { ActivityLogEntry } from '@/lib/types'
import { FilterChips, SearchInput, EmptyState, Btn, ShortcutBar } from '@/components/ui'

const ACTION_COLORS: Record<string, string> = {
  Created:  'rgba(34,197,94,0.12)',
  Updated:  'rgba(59,130,246,0.12)',
  Deleted:  'rgba(239,68,68,0.12)',
  Marked:   'rgba(234,179,8,0.12)',
  Moved:    'rgba(99,102,241,0.12)',
  Archived: 'rgba(82,82,91,0.2)',
}

function actionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find(k => action.startsWith(k))
  return key ? ACTION_COLORS[key] : 'rgba(82,82,91,0.2)'
}

const PAGE_SIZE = 50

export default function ActivityLogView() {
  const [log, setLog] = React.useState<ActivityLogEntry[]>([])
  const [page, setPage] = React.useState(0)
  const [typeFilter, setTypeFilter] = React.useState('All')
  const [sourceFilter, setSourceFilter] = React.useState('All')
  const [search, setSearch] = React.useState('')

  React.useEffect(() => { setLog(getActivityLog()) }, [])

  const filtered = React.useMemo(() => {
    let list = log
    if (typeFilter !== 'All') list = list.filter(e => e.entityType === typeFilter)
    if (sourceFilter !== 'All') list = list.filter(e => (e.source || 'Manual') === sourceFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e => [e.action, e.entityName, e.details].some(f => (f||'').toLowerCase().includes(q)))
    }
    return list
  }, [log, typeFilter, sourceFilter, search])

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[#27272a] flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <h1 className="m-0 text-[18px] font-bold text-[#e4e4e7] flex-1 tracking-tight">Activity Log</h1>
          <span className="text-[12px] text-[#52525b]">{filtered.length} entries</span>
          <Btn variant="outline" small onClick={() => exportCSV(filtered.map(e => ({ Timestamp:e.timestamp, Action:e.action, Type:e.entityType, Name:e.entityName, Details:e.details, Source:e.source||'Manual' })), 'activity-log.csv')}>Export CSV</Btn>
          <Btn variant="ghost" small onClick={() => setLog(getActivityLog())}>Refresh</Btn>
        </div>
        <div className="flex gap-2.5 flex-wrap items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search log…" />
          <FilterChips options={['All','Client','Project','Invoice']} active={typeFilter} onChange={v => setTypeFilter(v||'All')} />
          <FilterChips options={['All','Manual','AI']} active={sourceFilter} onChange={v => setSourceFilter(v||'All')} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-16">
        {!paged.length ? (
          <EmptyState icon="📋" title="No activity yet" subtitle="Actions you take in the dashboard appear here." />
        ) : (
          <>
            <table className="cinema-table">
              <thead>
                <tr>
                  {['Timestamp','Action','Type','Record','Details','Source'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(entry => (
                  <tr key={entry.id}>
                    <td className="text-[11px] font-mono text-[#52525b] whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                    </td>
                    <td>
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-medium" style={{ background: actionColor(entry.action) }}>{entry.action}</span>
                    </td>
                    <td className="text-[#52525b]">{entry.entityType}</td>
                    <td className="font-medium text-[#e4e4e7]">{entry.entityName || '—'}</td>
                    <td className="text-[#52525b] max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap text-[12px]" title={entry.details}>{entry.details || '—'}</td>
                    <td>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${entry.source==='AI' ? 'bg-[rgba(139,92,246,0.12)] text-[#a78bfa]' : 'bg-[#27272a] text-[#71717a]'}`}>
                        {entry.source || 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Btn small variant="ghost" disabled={page===0} onClick={() => setPage(p=>p-1)}>← Prev</Btn>
                <span className="text-[12px] text-[#71717a]">Page {page+1} of {totalPages}</span>
                <Btn small variant="ghost" disabled={page>=totalPages-1} onClick={() => setPage(p=>p+1)}>Next →</Btn>
              </div>
            )}
          </>
        )}
      </div>
      <ShortcutBar shortcuts={[{key:'/',label:'Search log'}]} />
    </div>
  )
}
