import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, User, Globe, Wifi, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import RiskBadge from '../components/RiskBadge'
import api from '../api/client'
import toast from 'react-hot-toast'

const typeConfig = {
  username: { icon: User, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  domain: { icon: Globe, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  ip: { icon: Wifi, color: 'text-orange-400', bg: 'bg-orange-400/10' }
}

function InvestigationRow({ inv, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = typeConfig[inv.type] || typeConfig.domain

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="card glass-hover"
    >
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-2 rounded-lg ${cfg.bg} ${cfg.color} shrink-0`}>
          <cfg.icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-white truncate">{inv.target}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {inv.type} · {new Date(inv.createdAt).toLocaleString()}
          </p>
        </div>
        <RiskBadge score={inv.riskScore} size="sm" />
        <button
          onClick={e => { e.stopPropagation(); onDelete(inv._id) }}
          className="p-2 text-slate-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
        {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </div>

      <AnimatePresence>
        {expanded && inv.rawData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/5">
              <pre className="text-xs font-mono text-slate-400 overflow-x-auto bg-dark-800 rounded-lg p-4 max-h-48">
                {JSON.stringify(inv.rawData, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function History() {
  const [investigations, setInvestigations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/history')
        setInvestigations(res.data.investigations || [])
      } catch {
        toast.error('Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const handleDelete = async (id) => {
    try {
      await api.delete(`/history/${id}`)
      setInvestigations(prev => prev.filter(i => i._id !== id))
      toast.success('Investigation deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = investigations.filter(inv => {
    const matchType = filter === 'all' || inv.type === filter
    const matchSearch = !search || inv.target.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Investigation History"
        subtitle="All past investigations with full data"
        icon={Clock}
        color="cyan"
      />

      {/* Filters */}
      <div className="card flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
            placeholder="Search targets..."
          />
        </div>
        <div className="flex gap-2">
          {['all', 'username', 'domain', 'ip'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs font-mono text-slate-500">
        {filtered.length} investigation{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Clock size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No investigations found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(inv => (
              <InvestigationRow key={inv._id} inv={inv} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
