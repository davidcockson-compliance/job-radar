import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { RefreshCw, TrendingUp, Target, Activity, Inbox } from 'lucide-react'

interface Stats {
  total: number
  byStatus: {
    RADAR_NEW: number
    SHORTLISTED: number
    APPLIED: number
    INTERVIEWING: number
    ARCHIVED: number
  }
  bySource: Array<{ source: string; _count: { id: number } }>
  scoreStats: { avg: number; max: number; min: number }
  recentActivity: { newLeads: number; applications: number }
  generatedAt: string
}

const STATUS_COLORS = {
  RADAR_NEW: '#10b981',
  SHORTLISTED: '#3b82f6',
  APPLIED: '#8b5cf6',
  INTERVIEWING: '#06b6d4',
  ARCHIVED: '#64748b',
}

const SOURCE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
        <p className="text-slate-400">Failed to load stats</p>
        <button
          onClick={fetchStats}
          className="mt-4 rounded bg-slate-700 px-4 py-2 hover:bg-slate-600"
        >
          Retry
        </button>
      </div>
    )
  }

  // Prepare data for charts
  const funnelData = [
    { name: 'New', value: stats.byStatus.RADAR_NEW, fill: STATUS_COLORS.RADAR_NEW },
    { name: 'Shortlisted', value: stats.byStatus.SHORTLISTED, fill: STATUS_COLORS.SHORTLISTED },
    { name: 'Applied', value: stats.byStatus.APPLIED, fill: STATUS_COLORS.APPLIED },
    { name: 'Interviewing', value: stats.byStatus.INTERVIEWING, fill: STATUS_COLORS.INTERVIEWING },
  ]

  const sourceData = stats.bySource.map((s, i) => ({
    name: s.source,
    value: s._count.id,
    fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }))

  const conversionRate = stats.byStatus.RADAR_NEW + stats.byStatus.SHORTLISTED > 0
    ? Math.round((stats.byStatus.SHORTLISTED / (stats.byStatus.RADAR_NEW + stats.byStatus.SHORTLISTED)) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Inbox className="h-4 w-4" />
            <span className="text-sm">Total Leads</span>
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.total}</div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Last 7 Days</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-400">
            +{stats.recentActivity.newLeads}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Target className="h-4 w-4" />
            <span className="text-sm">Shortlist Rate</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-400">
            {conversionRate}%
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Avg Score</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-400">
            {stats.scoreStats.avg > 0 ? '+' : ''}{stats.scoreStats.avg}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <h3 className="mb-4 font-medium">Pipeline Funnel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Source */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <h3 className="mb-4 font-medium">Leads by Source</h3>
          <div className="h-64">
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                No data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <h3 className="mb-4 font-medium">Status Breakdown</h3>
        <div className="grid gap-3 sm:grid-cols-5">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center justify-between rounded-lg bg-slate-900 p-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }}
                />
                <span className="text-sm text-slate-400">
                  {status.replace('_', ' ')}
                </span>
              </div>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score Distribution */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <h3 className="mb-4 font-medium">Score Statistics</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400">Minimum</div>
            <div className={`mt-1 text-2xl font-bold ${stats.scoreStats.min < 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {stats.scoreStats.min}
            </div>
          </div>
          <div className="rounded-lg bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400">Average</div>
            <div className={`mt-1 text-2xl font-bold ${stats.scoreStats.avg > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {stats.scoreStats.avg > 0 ? '+' : ''}{stats.scoreStats.avg}
            </div>
          </div>
          <div className="rounded-lg bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400">Maximum</div>
            <div className="mt-1 text-2xl font-bold text-emerald-400">
              +{stats.scoreStats.max}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500">
        Last updated: {new Date(stats.generatedAt).toLocaleString()}
      </div>
    </div>
  )
}

export default StatsView
