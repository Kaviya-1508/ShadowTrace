import { motion } from 'framer-motion'

export default function PageHeader({ title, subtitle, icon: Icon, color = 'cyan' }) {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    violet: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    green: 'text-green-400 bg-green-400/10 border-green-400/20',
    orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex items-center gap-4"
    >
      {Icon && (
        <div className={`p-3 rounded-xl border ${colors[color]}`}>
          <Icon size={24} />
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-white font-mono tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  )
}
