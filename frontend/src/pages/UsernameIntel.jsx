import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Search, CheckCircle, XCircle, ExternalLink, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import RiskBadge from '../components/RiskBadge'
import LoadingPulse from '../components/LoadingPulse'
import api from '../api/client'
import toast from 'react-hot-toast'

const PLATFORM_META = {
  github:       { label: 'GitHub',        color: 'text-white',       icon: '⌥' },
  reddit:       { label: 'Reddit',        color: 'text-orange-400',  icon: '●' },
  devto:        { label: 'Dev.to',        color: 'text-violet-400',  icon: '◆' },
  medium:       { label: 'Medium',        color: 'text-green-400',   icon: '▲' },
  stackoverflow:{ label: 'Stack Overflow',color: 'text-yellow-400',  icon: '◎' },
  gitlab:       { label: 'GitLab',        color: 'text-orange-500',  icon: '◈' },
  kaggle:       { label: 'Kaggle',        color: 'text-cyan-400',    icon: '◉' },
  hackerrank:   { label: 'HackerRank',    color: 'text-green-500',   icon: '★' },
  leetcode:     { label: 'LeetCode',      color: 'text-yellow-500',  icon: '◐' },
  twitch:       { label: 'Twitch',        color: 'text-violet-500',  icon: '▶' },
  pinterest:    { label: 'Pinterest',     color: 'text-red-400',     icon: '◎' },
  pypi:         { label: 'PyPI',          color: 'text-blue-400',    icon: '◆' },
  npm:          { label: 'npm',           color: 'text-red-500',     icon: '◉' },
  hashnode:     { label: 'Hashnode',      color: 'text-blue-500',    icon: '◈' },
  codepen:      { label: 'CodePen',       color: 'text-white',       icon: '◎' },
  replit:       { label: 'Replit',        color: 'text-orange-400',  icon: '▶' },
  dockerhub:    { label: 'Docker Hub',    color: 'text-blue-400',    icon: '◆' },
  bitbucket:    { label: 'Bitbucket',     color: 'text-blue-500',    icon: '◉' },
  producthunt:  { label: 'Product Hunt',  color: 'text-orange-500',  icon: '▲' },
  youtube:      { label: 'YouTube',       color: 'text-red-500',     icon: '▶' },
}

function PlatformCard({ p, index }) {
  const meta  = PLATFORM_META[p.platform] || { label: p.platform, color: 'text-cyan-400', icon: '◎' }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      transition={{ delay: index * 0.03 }}
      className={`relative rounded-xl p-3 border transition-all duration-200 group
        ${p.found
          ? 'bg-dark-700 border-green-500/25 hover:border-green-400/50 hover:shadow-[0_0_15px_rgba(74,222,128,0.1)]'
          : 'bg-dark-800/40 border-dark-500/30 opacity-50'
        }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {p.found
            ? <CheckCircle size={13} className="text-green-400 shrink-0" />
            : <XCircle    size={13} className="text-slate-600 shrink-0" />
          }
          <span className={`text-sm font-medium capitalize truncate ${p.found ? meta.color : 'text-slate-600'}`}>
            {meta.label}
          </span>
        </div>
        {p.found && p.url && (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-cyan-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Rich data for GitHub */}
      {p.found && p.data?.repos !== undefined && (
        <div className="mt-2 space-y-0.5">
          <p className="text-xs font-mono text-slate-400">
            {p.data.repos} repos · {p.data.followers?.toLocaleString()} followers
          </p>
          {p.data.created && (
            <p className="text-xs font-mono text-slate-500">
              joined {new Date(p.data.created).toLocaleDateString()}
            </p>
          )}
          {p.data.email && (
            <p className="text-xs font-mono text-cyan-400">📧 {p.data.email}</p>
          )}
          {p.data.location && (
            <p className="text-xs font-mono text-slate-500">📍 {p.data.location}</p>
          )}
        </div>
      )}

      {/* Reddit karma */}
      {p.found && p.data?.karma !== undefined && (
        <p className="mt-1.5 text-xs font-mono text-slate-400">karma: {p.data.karma?.toLocaleString()}</p>
      )}

      {/* Dev.to */}
      {p.found && p.data?.name && p.platform === 'devto' && (
        <p className="mt-1.5 text-xs font-mono text-slate-400">{p.data.name}</p>
      )}

      {/* Stack Overflow */}
      {p.found && p.data?.reputation !== undefined && (
        <p className="mt-1.5 text-xs font-mono text-slate-400">rep: {p.data.reputation?.toLocaleString()}</p>
      )}

      {/* Unverified badge for head-check platforms */}
      {p.found && !p.data?.repos && !p.data?.karma && !p.data?.reputation && (
        <p className="mt-1.5 text-xs font-mono text-slate-600">profile exists</p>
      )}
    </motion.div>
  )
}

export default function UsernameIntel() {
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [showNotFound, setShowNotFound] = useState(false)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setShowNotFound(false)
    try {
      const res = await api.post('/intelligence/username', { username: query.trim() })
      setResult(res.data)
      toast.success(`Found on ${res.data.foundCount} of ${res.data.totalChecked} platforms`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const foundPlatforms    = result?.platforms?.filter(p =>  p.found) || []
  const notFoundPlatforms = result?.platforms?.filter(p => !p.found) || []

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Username Intelligence"
        subtitle="Discover digital presence across 20 platforms"
        icon={User}
        color="cyan"
      />

      {/* Search bar */}
      <div className="card">
        <form onSubmit={handleScan} className="flex gap-3">
          <div className="relative flex-1">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-field pl-10"
              placeholder="Enter username to investigate..."
              disabled={loading}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary flex items-center gap-2 px-6"
          >
            <Search size={16} />
            {loading ? 'Scanning...' : 'Scan'}
          </motion.button>
        </form>
        <p className="text-xs text-slate-600 mt-3 font-mono">
          ▸ Checks GitHub · Reddit · Dev.to · GitLab · PyPI · npm · YouTube · and 13 more
        </p>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card">
            <LoadingPulse message={`Scanning ${query} across 20 platforms...`} />
            <p className="text-center text-xs text-slate-600 font-mono mt-2">This may take 15–30 seconds</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Summary card */}
            <div className="card">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">Target</p>
                  <h2 className="text-3xl font-bold font-mono text-white">{result.username}</h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Found on{' '}
                    <span className="text-green-400 font-bold text-lg">{result.foundCount}</span>
                    <span className="text-slate-500"> / {result.totalChecked} platforms</span>
                  </p>
                </div>
                <RiskBadge score={result.riskScore} />
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.foundCount / result.totalChecked) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-green-400 rounded-full"
                  />
                </div>
                <p className="text-xs text-slate-600 font-mono mt-1">
                  {Math.round((result.foundCount / result.totalChecked) * 100)}% platform coverage
                </p>
              </div>
            </div>

            {/* Found platforms grid */}
            {foundPlatforms.length > 0 && (
              <div>
                <h3 className="text-xs font-mono text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle size={12} />
                  Found on {foundPlatforms.length} platforms
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {foundPlatforms.map((p, i) => (
                    <PlatformCard key={p.platform} p={p} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Not found — collapsible */}
            {notFoundPlatforms.length > 0 && (
              <div>
                <button
                  onClick={() => setShowNotFound(!showNotFound)}
                  className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showNotFound ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showNotFound ? 'Hide' : 'Show'} {notFoundPlatforms.length} platforms not found
                </button>
                <AnimatePresence>
                  {showNotFound && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{   opacity: 0, height: 0 }}
                      className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 overflow-hidden"
                    >
                      {notFoundPlatforms.map((p, i) => (
                        <PlatformCard key={p.platform} p={p} index={i} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Risk indicators */}
            {result.riskFactors?.length > 0 && (
              <div className="card border-yellow-500/20">
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">Risk Indicators</h3>
                <ul className="space-y-2">
                  {result.riskFactors.map((f, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 text-sm text-slate-400"
                    >
                      <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                      {f}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
