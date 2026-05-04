'use client'

// ── Simple SVG charts (no external deps required) ─────────────────────────────

interface DataPoint { [key: string]: string | number | null | undefined }

export function BarChartSimple({
  data, dataKey, color = '#fbbf24', height = 180, formatValue,
}: {
  data: DataPoint[]
  dataKey: string
  color?: string
  height?: number
  formatValue?: (v: number) => string
}) {
  if (!data.length) return null
  const vals = data.map(d => Number(d[dataKey]) || 0)
  const max = Math.max(...vals, 1)
  const barW = (100 / data.length) * 0.65
  const gap  = (100 / data.length) * 0.35
  const fmt  = formatValue ?? (v => v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : String(v))
  const nameKey = data[0] && 'month' in data[0] ? 'month' : Object.keys(data[0])[0]

  return (
    <div style={{ width: '100%', height }}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1="0" y1={height * (1 - f) * 0.8 + height * 0.02} x2="100" y2={height * (1 - f) * 0.8 + height * 0.02} stroke="#27272a" strokeWidth="0.5" />
        ))}
        {data.map((d, i) => {
          const val = Number(d[dataKey]) || 0
          const barH = max > 0 ? (val / max) * height * 0.78 : 0
          const x = (i / data.length) * 100 + gap / 2
          const y = height * 0.80 - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={d.forecast != null ? '#3f3f46' : color} rx="0.5">
                <title>{String(d[nameKey])}: {fmt(val)}</title>
              </rect>
              <text x={x + barW / 2} y={height * 0.96} textAnchor="middle" fontSize="3.5" fill="#52525b">
                {String(d[nameKey])}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function LineChartSimple({
  data, lines, height = 220, formatValue,
}: {
  data: DataPoint[]
  lines: { dataKey: string; color: string; dashed?: boolean }[]
  height?: number
  formatValue?: (v: number) => string
}) {
  if (!data.length) return null
  const fmt = formatValue ?? (v => v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : String(v))
  const allVals = lines.flatMap(l => data.map(d => Number(d[l.dataKey]) || 0))
  const max = Math.max(...allVals, 1)
  const W = 100, H = height, padT = 4, padB = 16, padL = 8, padR = 4
  const chartH = H - padT - padB
  const chartW = W - padL - padR
  const nameKey = 'month'

  function px(i: number) { return padL + (i / (data.length - 1)) * chartW }
  function py(v: number) { return padT + chartH - (v / max) * chartH }

  return (
    <div style={{ width: '100%', height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={padL} y1={padT + chartH * (1 - f)} x2={W - padR} y2={padT + chartH * (1 - f)} stroke="#27272a" strokeWidth="0.5" />
        ))}
        {lines.map(l => {
          const segments: string[][] = []
          let cur: string[] = []
          data.forEach((d, i) => {
            const v = d[l.dataKey]
            if (v != null) { cur.push(`${px(i)},${py(Number(v))}`) }
            else { if (cur.length) { segments.push([...cur]); cur = [] } }
          })
          if (cur.length) segments.push(cur)
          return segments.map((seg, si) => (
            <polyline key={`${l.dataKey}-${si}`} points={seg.join(' ')} fill="none" stroke={l.color}
              strokeWidth="1.2" strokeDasharray={l.dashed ? '3,2' : undefined}
              strokeLinecap="round" strokeLinejoin="round" />
          ))
        })}
        {lines.map(l => data.map((d, i) => {
          const v = d[l.dataKey]
          if (v == null) return null
          return <circle key={`${l.dataKey}-${i}`} cx={px(i)} cy={py(Number(v))} r="1" fill={l.color}>
            <title>{String(d[nameKey])}: {fmt(Number(v))}</title>
          </circle>
        }))}
        {data.map((d, i) => (
          <text key={i} x={px(i)} y={H - 2} textAnchor="middle" fontSize="3.5" fill="#52525b">{String(d[nameKey])}</text>
        ))}
      </svg>
    </div>
  )
}

export function StackedBarChart({
  data, keys, colors, height = 200,
}: {
  data: DataPoint[]
  keys: string[]
  colors: string[]
  height?: number
}) {
  if (!data.length) return null
  const totals = data.map(d => keys.reduce((s, k) => s + (Number(d[k]) || 0), 0))
  const max = Math.max(...totals, 1)
  const barW = (100 / data.length) * 0.65
  const gap  = (100 / data.length) * 0.35
  const nameKey = 'month'

  return (
    <div style={{ width: '100%', height }}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1="0" y1={height * (1-f) * 0.8 + height * 0.02} x2="100" y2={height*(1-f)*0.8+height*0.02} stroke="#27272a" strokeWidth="0.5" />
        ))}
        {data.map((d, i) => {
          const x = (i / data.length) * 100 + gap / 2
          let yOff = height * 0.80
          return (
            <g key={i}>
              {keys.map((k, ki) => {
                const val = Number(d[k]) || 0
                const barH = max > 0 ? (val / max) * height * 0.78 : 0
                yOff -= barH
                return <rect key={k} x={x} y={yOff} width={barW} height={barH} fill={colors[ki]} rx="0.3"><title>{k}: {val}</title></rect>
              })}
              <text x={x + barW / 2} y={height * 0.96} textAnchor="middle" fontSize="3.5" fill="#52525b">{String(d[nameKey])}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function DonutChart({
  data, colors, size = 140,
}: {
  data: { name: string; value: number }[]
  colors: string[]
  size?: number
}) {
  if (!data.length) return null
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return null
  const r = 40, cx = 50, cy = 50, innerR = 24
  let cumAngle = -Math.PI / 2

  function arc(sa: number, ea: number) {
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa)
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea)
    const x3 = cx + innerR * Math.cos(ea), y3 = cy + innerR * Math.sin(ea)
    const x4 = cx + innerR * Math.cos(sa), y4 = cy + innerR * Math.sin(sa)
    const large = ea - sa > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z`
  }

  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      {data.map((d, i) => {
        const angle = (d.value / total) * 2 * Math.PI
        const sa = cumAngle; cumAngle += angle
        return <path key={i} d={arc(sa, cumAngle)} fill={colors[i % colors.length]} stroke="#111113" strokeWidth="0.5"><title>{d.name}: {d.value}</title></path>
      })}
    </svg>
  )
}
