'use client'

import React from 'react'
import { getClients, getInvoices, fmtCurrency, fmtDate } from '@/lib/data'
import { EmptyState } from '@/components/ui'
import { BarChartSimple, LineChartSimple, StackedBarChart, DonutChart } from '@/components/Charts'

export default function AnalyticsView() {
  const [data, setData] = React.useState<ReturnType<typeof buildData> | null>(null)

  React.useEffect(() => { setData(buildData()) }, [])

  if (!data) return <div className="p-10 text-[#52525b]">Loading…</div>

  const COLORS = ['#fbbf24','#60a5fa','#818cf8','#f87171','#34d399','#a78bfa']

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 pb-16">
      <h1 className="text-[18px] font-bold text-[#e4e4e7] tracking-tight m-0 mb-4">Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label:'Total Revenue', val:fmtCurrency(data.totalRevenue) },
          { label:'Avg Setup Fee', val:fmtCurrency(data.avgSetup) },
          { label:'Avg Monthly Fee', val:fmtCurrency(data.avgMonthly) },
          { label:'Client LTV (12mo)', val:fmtCurrency(data.clv) },
          { label:'Churn Rate', val:`${data.churnRate}%`, warn:data.churnRate>20 },
        ].map(k => (
          <div key={k.label} className="bg-[#111113] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] text-[#52525b] uppercase tracking-wider mb-1">{k.label}</div>
            <div className="text-[20px] font-bold" style={{ color: k.warn ? '#f87171' : '#e4e4e7' }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* MRR over time */}
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 col-span-2">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-1">MRR Over Time + Forecast</div>
          <div className="flex gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-[11px] text-[#71717a]"><span className="inline-block w-5 h-0.5 bg-[#fbbf24] rounded" />Actual MRR</span>
            <span className="flex items-center gap-1.5 text-[11px] text-[#71717a]"><span className="inline-block w-5 h-0.5 bg-[#52525b] rounded" />Forecast</span>
          </div>
          {data.mrrHistory.some(d => d.mrr || d.forecast)
            ? <LineChartSimple data={data.mrrHistory} lines={[{ dataKey:'mrr', color:'#fbbf24' },{ dataKey:'forecast', color:'#52525b', dashed:true }]} height={220} formatValue={v=>fmtCurrency(v)} />
            : <EmptyState icon="📈" title="No MRR data yet" />
          }
        </div>

        {/* New clients */}
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-3">New Clients Per Month</div>
          {data.newClients.some(d=>d.count>0)
            ? <BarChartSimple data={data.newClients} dataKey="count" color="#fbbf24" height={180} formatValue={v=>String(v)} />
            : <EmptyState icon="👥" title="No data yet" />
          }
        </div>

        {/* Status breakdown */}
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-3">Client Status Breakdown</div>
          {data.statusData.length>0
            ? <div className="flex items-center gap-6">
                <DonutChart data={data.statusData} colors={COLORS} size={140} />
                <div className="flex flex-col gap-1.5">
                  {data.statusData.map((d,i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[12px]">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background:COLORS[i%COLORS.length] }} />
                      <span className="text-[#a1a1aa]">{d.name}</span>
                      <span className="font-semibold text-[#e4e4e7] ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            : <EmptyState icon="🍩" title="No data" />
          }
        </div>

        {/* Revenue by offer */}
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-3">Revenue by Offer (MRR)</div>
          {data.offerData.some(d=>d.value>0)
            ? <div className="flex items-center gap-6">
                <DonutChart data={data.offerData} colors={['#fbbf24','#34d399']} size={140} />
                <div className="flex flex-col gap-1.5">
                  {data.offerData.map((d,i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[12px]">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background:['#fbbf24','#34d399'][i%2] }} />
                      <span className="text-[#a1a1aa] flex-1">{d.name}</span>
                      <span className="font-semibold text-[#e4e4e7]">{fmtCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            : <EmptyState icon="🍩" title="No data" />
          }
        </div>

        {/* Setup vs Subscription */}
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 col-span-2">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-1">Setup vs Subscription Revenue (Last 6 Months)</div>
          <div className="flex gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-[11px] text-[#71717a]"><span className="w-2.5 h-2.5 bg-[#fbbf24] rounded-sm inline-block" />Setup</span>
            <span className="flex items-center gap-1.5 text-[11px] text-[#71717a]"><span className="w-2.5 h-2.5 bg-[#34d399] rounded-sm inline-block" />Subscriptions</span>
          </div>
          {data.revenueBreakdown.some(d=>(d.setup as number)+(d.subscription as number)>0)
            ? <StackedBarChart data={data.revenueBreakdown} keys={['setup','subscription']} colors={['#fbbf24','#34d399']} height={200} />
            : <EmptyState icon="📊" title="No collected revenue data" />
          }
        </div>

        {/* Collection rate */}
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-4">Invoice Collection Rate</div>
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 36 36" style={{ transform:'rotate(-90deg)', width:80, height:80 }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={data.collectionRate>=80?'#4ade80':data.collectionRate>=60?'#fbbf24':'#f87171'}
                  strokeWidth="3" strokeDasharray={`${data.collectionRate} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[18px] font-bold text-[#e4e4e7]">{data.collectionRate}%</div>
            </div>
            <div className="text-[13px] text-[#71717a]">
              <div className="font-semibold text-[#e4e4e7] mb-1">of invoices paid</div>
              <div className="text-[12px]">{data.collectionRate>=80?'Excellent rate':data.collectionRate>=60?'Room to improve':'Needs attention'}</div>
            </div>
          </div>
        </div>

        {/* Renewals */}
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-[#e4e4e7] mb-3">Renewals This Week</div>
          {data.renewals.length===0
            ? <div className="text-[13px] text-[#52525b]">No renewals in the next 7 days.</div>
            : data.renewals.map(c => (
              <div key={c.id} className="flex justify-between py-1.5 border-b border-[#27272a] last:border-0 text-[13px]">
                <span className="font-medium text-[#e4e4e7]">{c.name}</span>
                <span className="text-[#fbbf24] font-semibold">{fmtCurrency(c.monthlyFee)}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

function buildData() {
  const clients = getClients()
  const invoices = getInvoices()
  const now = new Date()

  const mrrHistory = [
    ...Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const mrr = clients.filter(c => c.subscriptionStatus === 'Active' && c.subscriptionStartDate && new Date(c.subscriptionStartDate) <= d)
        .reduce((s, c) => s + Number(c.monthlyFee || 0), 0)
      return { month: label, mrr }
    }),
    ...Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const activeMRR = clients.filter(c => c.subscriptionStatus === 'Active').reduce((s, c) => s + Number(c.monthlyFee || 0), 0)
      return { month: label, mrr: null as number | null, forecast: activeMRR }
    }),
  ]

  const newClients = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const end = new Date(now.getFullYear(), now.getMonth() - (10 - i), 1)
    return { month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), count: clients.filter(c => new Date(c.createdAt) >= d && new Date(c.createdAt) < end).length }
  })

  const statusData = ['Active','Pending','Paused','Churned'].map(s => ({ name: s, value: clients.filter(c => c.subscriptionStatus === s).length })).filter(d => d.value > 0)
  const offerData = ['Launch Package','Full Automation'].map(o => ({ name: o, value: clients.filter(c => c.offer === o && c.subscriptionStatus === 'Active').reduce((s, c) => s + Number(c.monthlyFee||0), 0) })).filter(d => d.value > 0)

  const revenueBreakdown = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const end = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1)
    const monthInvs = invoices.filter(inv => inv.status === 'Paid' && inv.paidAt && new Date(inv.paidAt) >= d && new Date(inv.paidAt) < end)
    return {
      month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      setup: monthInvs.filter(i => ['Setup 50%','Setup Full'].includes(i.type)).reduce((s,i) => s+Number(i.amount||0), 0),
      subscription: monthInvs.filter(i => i.type === 'Monthly').reduce((s,i) => s+Number(i.amount||0), 0),
    }
  })

  const paidCount = invoices.filter(i => i.status === 'Paid').length
  const collectionRate = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s,i) => s+Number(i.amount||0), 0)
  const setupInvs = invoices.filter(i => ['Setup 50%','Setup Full'].includes(i.type))
  const avgSetup = setupInvs.length ? setupInvs.reduce((s,i)=>s+Number(i.amount||0),0)/setupInvs.length : 0
  const activeClients = clients.filter(c => c.subscriptionStatus === 'Active')
  const avgMonthly = activeClients.length ? activeClients.reduce((s,c)=>s+Number(c.monthlyFee||0),0)/activeClients.length : 0
  const churnRate = clients.length > 0 ? Math.round((clients.filter(c=>c.subscriptionStatus==='Churned').length/clients.length)*100) : 0

  const today = new Date()
  const renewals = clients.filter(c => {
    if (c.subscriptionStatus !== 'Active' || !c.billingCycleDay) return false
    const next = new Date(today.getFullYear(), today.getMonth(), c.billingCycleDay)
    if (next < today) next.setMonth(next.getMonth()+1)
    return Math.ceil((next.getTime()-today.getTime())/86400000) <= 7
  })

  return { mrrHistory, newClients, statusData, offerData, revenueBreakdown, collectionRate, totalRevenue, avgSetup, avgMonthly, churnRate, clv: avgMonthly*12, renewals }
}
