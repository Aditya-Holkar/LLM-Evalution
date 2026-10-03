import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, } from 'recharts'
import { BarChart3, Radar as RadarIcon } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { METRICS } from '#/config/constants'
import { useApp } from '#/context/AppContext'
import { cn } from '#/lib/utils'

const CHART_COLORS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5']

function chartColor(i) {
  const val = getComputedStyle(document.documentElement).getPropertyValue(CHART_COLORS[i % CHART_COLORS.length]).trim()
  return val ? `oklch(${val})` : '#6366f1'
}

function formatLabel(val, format) {
  if (val === undefined || val === null) return ''
  switch (format) {
    case 's': return `${val.toFixed(2)}s`
    case 'ms': return `${val.toFixed(0)}ms`
    case 'currency': return `$${val.toFixed(6)}`
    case 'ratio': return val.toFixed(2)
    default: return Number(val).toLocaleString()
  }
}

export default function ChartsPanel() {
  const { results, selectedMetrics } = useApp()
  const [barMetric, setBarMetric] = useState(selectedMetrics?.[0] || 'latency')

  const activeMetric = METRICS.find((m) => m.id === barMetric)
  const sortedMetrics = METRICS.filter((m) => selectedMetrics?.includes(m.id))
  const successful = results.filter((r) => !r.error)

  if (successful.length === 0) return null

  const barData = successful.map((r) => ({
    name: r.modelName.split(' ').slice(0, 2).join(' '),
    value: r.metrics?.[barMetric] || 0,
  }))

  const qualityRadarData = [{
    ...successful.reduce((acc, r) => ({ ...acc, [`${r.modelName.split(' ')[0]}-Accuracy`]: r.accuracy || 0, [`${r.modelName.split(' ')[0]}-Clarity`]: r.clarity || 0, [`${r.modelName.split(' ')[0]}-Completeness`]: r.completeness || 0 }), {}),
  }]

  const radarModels = successful.map((r) => ({ name: r.modelName.split(' ').slice(0, 2).join(' '), Accuracy: r.accuracy || 0, Clarity: r.clarity || 0, Completeness: r.completeness || 0 }))

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Tabs.Root defaultValue="bar" className="w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Visualization</h2>
          <Tabs.List className="flex gap-1">
            {[
              { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
              { id: 'radar', label: 'Quality Radar', icon: RadarIcon },
            ].map(({ id, label, icon: Icon }) => (
              <Tabs.Trigger
                key={id}
                value={id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground hover:text-foreground"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>

        <Tabs.Content value="bar" className="p-3 sm:p-4">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Metric:</label>
            <select
              value={barMetric}
              onChange={(e) => setBarMetric(e.target.value)}
              className="flex-1 max-w-xs px-3 py-1.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {sortedMetrics.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div className="w-full h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--card-foreground)' }} formatter={(value) => [formatLabel(value, activeMetric?.format), activeMetric?.label]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => (
                    <rect key={i} fill={chartColor(i)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tabs.Content>

        <Tabs.Content value="radar" className="p-3 sm:p-4">
          <div className="w-full h-[300px] sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarModels}>
                <PolarGrid stroke="var(--border)" opacity={0.5} />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                {['Accuracy', 'Clarity', 'Completeness'].map((key, i) => (
                  <Radar key={key} name={key} dataKey={key} stroke={chartColor(i)} fill={chartColor(i)} fillOpacity={0.15} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Quality scores: Accuracy, Clarity, Completeness (0-10)</p>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
