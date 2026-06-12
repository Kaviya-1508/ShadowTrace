import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Search, Shield, Server, Lock, List, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import RiskBadge from '../components/RiskBadge'
import LoadingPulse from '../components/LoadingPulse'
import api from '../api/client'
import toast from 'react-hot-toast'

function InfoRow({ label, value, highlight }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs font-mono text-slate-500 w-32 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm font-mono break-all ${highlight ? 'text-cyan-400' : 'text-slate-300'}`}>{value}</span>
    </div>
  )
}

export default function DomainIntel() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/intelligence/domain', { domain: query.trim() })
      setResult(res.data)
      toast.success('Domain analysis complete')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Domain Intelligence"
        subtitle="WHOIS, DNS records, SSL info, and subdomain discovery"
        icon={Globe}
        color="violet"
      />

      <div className="card">
        <form onSubmit={handleScan} className="flex gap-3">
          <div className="relative flex-1">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-field pl-10"
              placeholder="example.com"
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
          ▸ Runs WHOIS · DNS lookup · SSL check · crt.sh subdomain discovery
        </p>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card">
            <LoadingPulse message={`Analyzing domain: ${query}`} />
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
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">Domain</p>
                  <h2 className="text-2xl font-bold font-mono text-white">{result.domain}</h2>
                  {result.whois?.registrar && (
                    <p className="text-sm text-slate-400 mt-1">via {result.whois.registrar}</p>
                  )}
                </div>
                <RiskBadge score={result.riskScore} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WHOIS */}
              {result.whois && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={16} className="text-violet-400" />
                    <h3 className="text-sm font-mono text-slate-300 font-semibold">WHOIS</h3>
                  </div>
                  <InfoRow label="registrar" value={result.whois.registrar} />
                  <InfoRow label="created" value={result.whois.creationDate} />
                  <InfoRow label="expires" value={result.whois.expirationDate} />
                  <InfoRow label="country" value={result.whois.country} />
                  <InfoRow label="privacy" value={result.whois.privacyProtected ? 'Protected' : 'Public'} />
                </motion.div>
              )}

              {/* SSL */}
              {result.ssl && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock size={16} className="text-green-400" />
                    <h3 className="text-sm font-mono text-slate-300 font-semibold">SSL Certificate</h3>
                  </div>
                  <InfoRow label="issuer" value={result.ssl.issuer} />
                  <InfoRow label="expires" value={result.ssl.expiry} highlight={result.ssl.expiringSoon} />
                  <InfoRow label="subject" value={result.ssl.subject} />
                  {result.ssl.expiringSoon && (
                    <div className="mt-3 flex items-center gap-2 text-yellow-400 text-xs font-mono">
                      <AlertTriangle size={12} />
                      Certificate expiring soon
                    </div>
                  )}
                </motion.div>
              )}

              {/* DNS */}
              {result.dns && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <Server size={16} className="text-cyan-400" />
                    <h3 className="text-sm font-mono text-slate-300 font-semibold">DNS Records</h3>
                  </div>
                  {result.dns.a?.length > 0 && (
                    <InfoRow label="A records" value={result.dns.a.join(', ')} highlight />
                  )}
                  {result.dns.mx?.length > 0 && (
                    <InfoRow label="MX records" value={result.dns.mx.slice(0, 2).join(', ')} />
                  )}
                  {result.dns.ns?.length > 0 && (
                    <InfoRow label="Nameservers" value={result.dns.ns.join(', ')} />
                  )}
                  {result.dns.txt?.length > 0 && (
                    <InfoRow label="TXT records" value={result.dns.txt.slice(0, 2).join(' | ')} />
                  )}
                </motion.div>
              )}

              {/* Subdomains */}
              {result.subdomains?.length > 0 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <List size={16} className="text-orange-400" />
                      <h3 className="text-sm font-mono text-slate-300 font-semibold">Subdomains</h3>
                    </div>
                    <span className="text-xs font-mono text-orange-400">{result.subdomains.length} found</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {result.subdomains.map((sub, i) => (
                      <p key={i} className="text-xs font-mono text-slate-400 py-1 border-b border-white/5 last:border-0">
                        <span className="text-orange-400/60 mr-2">▸</span>{sub}
                      </p>
                    ))}
                  </div>
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
                      <span className="text-yellow-400 mt-0.5">▸</span>{f}
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
