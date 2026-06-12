import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, Search, MapPin, Building, AlertTriangle, Shield } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import RiskBadge from '../components/RiskBadge'
import LoadingPulse from '../components/LoadingPulse'
import api from '../api/client'
import toast from 'react-hot-toast'

function InfoRow({ label, value, highlight }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs font-mono text-slate-500 w-28 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm font-mono break-all ${highlight ? 'text-cyan-400' : 'text-slate-300'}`}>{String(value)}</span>
    </div>
  )
}

export default function IPIntel() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/intelligence/ip', { ip: query.trim() })
      setResult(res.data)
      toast.success('IP analysis complete')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="IP Intelligence"
        subtitle="Geolocation, ISP info, and threat reputation analysis"
        icon={Wifi}
        color="orange"
      />

      <div className="card">
        <form onSubmit={handleScan} className="flex gap-3">
          <div className="relative flex-1">
            <Wifi size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-field pl-10"
              placeholder="8.8.8.8 or 2001:db8::1"
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
            {loading ? 'Analyzing...' : 'Analyze'}
          </motion.button>
        </form>
        <p className="text-xs text-slate-600 mt-3 font-mono">
          ▸ Queries ip-api.com for geolocation · AbuseIPDB for threat reputation
        </p>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card">
            <LoadingPulse message={`Analyzing IP: ${query}`} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Summary */}
            <div className="card">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">IP Address</p>
                  <h2 className="text-2xl font-bold font-mono text-white">{result.ip}</h2>
                  {result.geo?.country && (
                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin size={12} />
                      {[result.geo.city, result.geo.regionName, result.geo.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <RiskBadge score={result.riskScore} />
              </div>

              {/* Threat bar */}
              {result.abuse?.abuseConfidenceScore !== undefined && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-slate-500">Abuse Confidence</span>
                    <span className={`text-xs font-mono ${result.abuse.abuseConfidenceScore > 50 ? 'text-red-400' : result.abuse.abuseConfidenceScore > 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {result.abuse.abuseConfidenceScore}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.abuse.abuseConfidenceScore}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full rounded-full ${
                        result.abuse.abuseConfidenceScore > 50 ? 'bg-red-500' :
                        result.abuse.abuseConfidenceScore > 20 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Geolocation */}
              {result.geo && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={16} className="text-orange-400" />
                    <h3 className="text-sm font-mono text-slate-300 font-semibold">Geolocation</h3>
                  </div>
                  <InfoRow label="country" value={result.geo.country} />
                  <InfoRow label="region" value={result.geo.regionName} />
                  <InfoRow label="city" value={result.geo.city} />
                  <InfoRow label="timezone" value={result.geo.timezone} />
                  <InfoRow label="lat/lon" value={result.geo.lat && result.geo.lon ? `${result.geo.lat}, ${result.geo.lon}` : null} />
                </motion.div>
              )}

              {/* Network */}
              {result.geo && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <Building size={16} className="text-cyan-400" />
                    <h3 className="text-sm font-mono text-slate-300 font-semibold">Network</h3>
                  </div>
                  <InfoRow label="ISP" value={result.geo.isp} highlight />
                  <InfoRow label="org" value={result.geo.org} />
                  <InfoRow label="ASN" value={result.geo.as} />
                  <InfoRow label="type" value={result.geo.hosting ? 'Hosting/Datacenter' : result.geo.proxy ? 'Proxy/VPN' : 'Residential/Business'} />
                </motion.div>
              )}

              {/* Abuse/Threat */}
              {result.abuse && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                  className={`card ${result.abuse.abuseConfidenceScore > 50 ? 'border-red-500/20' : ''}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={16} className={result.abuse.abuseConfidenceScore > 50 ? 'text-red-400' : 'text-green-400'} />
                    <h3 className="text-sm font-mono text-slate-300 font-semibold">Threat Intelligence</h3>
                  </div>
                  <InfoRow label="abuse score" value={`${result.abuse.abuseConfidenceScore}%`} highlight={result.abuse.abuseConfidenceScore > 20} />
                  <InfoRow label="total reports" value={result.abuse.totalReports} />
                  <InfoRow label="last reported" value={result.abuse.lastReportedAt ? new Date(result.abuse.lastReportedAt).toLocaleDateString() : 'Never'} />
                  <InfoRow label="usage type" value={result.abuse.usageType} />
                </motion.div>
              )}
            </div>

            {/* Risk factors */}
            {result.riskFactors?.length > 0 && (
              <div className="card border-yellow-500/20">
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">Risk Indicators</h3>
                <ul className="space-y-2">
                  {result.riskFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />{f}
                    </li>
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
