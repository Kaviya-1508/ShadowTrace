import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Search, GitBranch, BarChart3, ArrowRight, Eye, Lock, Zap } from 'lucide-react'

const features = [
  { icon: Search, title: 'Multi-Target OSINT', desc: 'Investigate usernames, domains, and IP addresses from one unified platform.' },
  { icon: GitBranch, title: 'Correlation Engine', desc: 'Automatically discovers relationships between entities across investigations.' },
  { icon: Eye, title: 'Relationship Graph', desc: 'Interactive visual map of all discovered connections and data points.' },
  { icon: BarChart3, title: 'Risk Assessment', desc: 'AI-powered risk scoring based on exposure indicators and threat signals.' },
  { icon: Lock, title: 'Secure & Private', desc: 'All investigations are encrypted and tied to your personal account.' },
  { icon: Zap, title: 'Real-Time Intel', desc: 'Live queries to GitHub, AbuseIPDB, WHOIS, and DNS sources.' }
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-900 bg-grid overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Shield size={16} className="text-cyan-400" />
          </div>
          <span className="font-mono font-bold text-white tracking-wider text-sm">SHADOWTRACE NEXUS</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-secondary text-sm py-2">
            Sign In
          </button>
          <button onClick={() => navigate('/register')} className="btn-primary text-sm py-2">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            OSINT Intelligence Platform · v1.0
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Digital Footprint
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 text-glow">
              Intelligence
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Collect, correlate, and visualize digital intelligence from public sources.
            Investigate usernames, domains, and IP addresses — then map the connections between them.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              className="btn-primary flex items-center gap-2 px-8 py-3.5"
            >
              Start Investigating
              <ArrowRight size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              className="btn-secondary px-8 py-3.5"
            >
              Sign In
            </motion.button>
          </div>
        </motion.div>

        {/* Fake terminal preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 glass rounded-2xl border border-cyan-500/10 overflow-hidden text-left scan-container"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="ml-3 text-xs font-mono text-slate-600">shadowtrace — investigation terminal</span>
          </div>
          <div className="p-6 font-mono text-sm space-y-2">
            <p><span className="text-cyan-400">▸</span> <span className="text-slate-400">Initializing ShadowTrace Nexus...</span></p>
            <p><span className="text-green-400">✓</span> <span className="text-slate-400">Connected to intelligence sources</span></p>
            <p><span className="text-cyan-400">▸</span> <span className="text-slate-400">Scanning username: <span className="text-white">target_user</span></span></p>
            <p><span className="text-green-400">✓</span> <span className="text-slate-400">Found on GitHub · Reddit · Dev.to</span></p>
            <p><span className="text-cyan-400">▸</span> <span className="text-slate-400">Running domain analysis: <span className="text-white">example.com</span></span></p>
            <p><span className="text-green-400">✓</span> <span className="text-slate-400">WHOIS · DNS · SSL · 12 subdomains discovered</span></p>
            <p><span className="text-cyan-400">▸</span> <span className="text-slate-400">Correlating relationships...</span></p>
            <p><span className="text-violet-400">◆</span> <span className="text-slate-300">3 entity connections mapped</span></p>
            <p><span className="text-yellow-400">⚠</span> <span className="text-slate-400">Risk Score: <span className="text-yellow-300 font-bold">42/100 — MEDIUM</span></span></p>
            <p className="typing-cursor text-cyan-400/60 text-xs">ready for next target</p>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Intelligence Modules</h2>
          <p className="text-slate-500">Everything you need for comprehensive OSINT investigation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card glass-hover"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <f.icon size={18} className="text-cyan-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-6 text-center text-xs text-slate-600 font-mono">
        SHADOWTRACE NEXUS · OSINT Intelligence Platform · For educational purposes
      </footer>
    </div>
  )
}
