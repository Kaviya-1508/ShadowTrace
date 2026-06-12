import { motion } from 'framer-motion'

export default function IntelCard({ title, value, sub, icon: Icon, color = 'cyan', delay = 0 }) {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    violet: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    green: 'text-green-400 bg-green-400/10 border-green-400/20',
    orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    red: 'text-red-400 bg-red-400/10 border-red-400/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-white font-mono">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${colors[color]} transition-all duration-300 group-hover:scale-110`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
