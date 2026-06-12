import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, User, Globe, Wifi, GitBranch, Clock, TrendingUp, Activity } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import IntelCard from '../components/IntelCard'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const quickActions = [
  { label: 'Username Intel', path: '/username', icon: User, color: 'cyan', desc: 'Scan across platforms' },
  { label: 'Domain Intel', path: '/domain', icon: Globe, color: 'violet', desc: 'WHOIS, DNS, subdomains' },
  { label: 'IP Intel', path: '/ip', icon: Wifi, color: 'orange', desc: 'Geolocation & reputation' },
  { label: 'Relationship Graph', path: '/graph', icon: GitBranch, color: 'green', desc: 'Visual entity map' }
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, usernames: 0, domains: 0, ips: 0 })
  const [recent, setRecent] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, histRes] = await Promise.all([
          api.get('/history/stats'),
          api.get('/history?limit=50')
        ])
        setStats(statsRes.data)
        const investigations = histRes.data.investigations || []
        setRecent(investigations.slice(0, 5))

        // FIX: Build chart data from actual investigation timestamps, not all zeros
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          d.setHours(0, 0, 0, 0)
          return {
            day: d.toLocaleDateString('en', { weekday: 'short' }),
            date: d,
            count: 0
          }
        })

        investigations.forEach(inv => {
          const invDate = new Date(inv.createdAt)
          invDate.setHours(0, 0, 0, 0)
          const bucket = days.find(d => d.date.getTime() === invDate.getTime())
          if (bucket) bucket.count++
        })

        setChartData(days.map(({ day, count }) => ({ day, count })))
      } catch {
        // Silently fail — empty state is fine
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.username}`}
        subtitle="Your intelligence platform is ready"
        icon={Activity}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <IntelCard title="Total Investigations" value={stats.total} icon={Search} color="cyan" delay={0} />
        <IntelCard title="Usernames Scanned" value={stats.usernames} icon={User} color="violet" delay={0.1} />
        <IntelCard title="Domains Analyzed" value={stats.domains} icon={Globe} color="green" delay={0.2} />
        <IntelCard title="IPs Investigated" value={stats.ips} icon={Wifi} color="orange" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.path}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className="card glass-hover text-left group"
              >
                <action.icon size={20} className={`text-${action.color}-400 mb-3 group-hover:scale-110 transition-transform`} />
                <p className="font-semibold text-white text-sm">{action.label}</p>
                <p className="text-xs text-slate-500 mt-1">{action.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Activity chart — FIX: now shows real investigation counts per day */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider">Activity</h2>
            <TrendingUp size={16} className="text-cyan-400" />
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} fill="url(#grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-600 font-mono mt-2 text-center">Last 7 days</p>
        </div>
      </div>

      {/* Recent investigations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider">Recent Investigations</h2>
          <button onClick={() => navigate('/history')} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
            View all <Clock size={12} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="card text-center py-12">
            <Search size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No investigations yet.</p>
            <p className="text-slate-600 text-xs mt-1">Start by scanning a username, domain, or IP.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((inv, i) => (
              <motion.div
                key={inv._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card glass-hover flex items-center gap-4 py-3"
              >
                <div className={`p-2 rounded-lg ${
                  inv.type === 'username' ? 'bg-cyan-400/10 text-cyan-400' :
                  inv.type === 'domain' ? 'bg-violet-400/10 text-violet-400' :
                  'bg-orange-400/10 text-orange-400'
                }`}>
                  {inv.type === 'username' ? <User size={14} /> : inv.type === 'domain' ? <Globe size={14} /> : <Wifi size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-white truncate">{inv.target}</p>
                  <p className="text-xs text-slate-500">{inv.type} · {new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <div className={`text-xs font-mono px-2 py-1 rounded-full ${
                  inv.riskScore <= 30 ? 'text-green-400 bg-green-400/10' :
                  inv.riskScore <= 60 ? 'text-yellow-400 bg-yellow-400/10' :
                  'text-red-400 bg-red-400/10'
                }`}>
                  {inv.riskScore}/100
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
