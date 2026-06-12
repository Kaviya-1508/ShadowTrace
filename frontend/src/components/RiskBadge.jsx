import { motion } from 'framer-motion'
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'

export default function RiskBadge({ score, size = 'md' }) {
  const level = score <= 30 ? 'LOW' : score <= 60 ? 'MEDIUM' : 'HIGH'
  const config = {
    LOW: { icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', glow: 'shadow-green-400/20' },
    MEDIUM: { icon: ShieldAlert, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', glow: 'shadow-yellow-400/20' },
    HIGH: { icon: ShieldX, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', glow: 'shadow-red-400/20' }
  }
  const { icon: Icon, color, bg, border, glow } = config[level]
  const padding = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full ${bg} border ${border} ${color} font-mono font-medium shadow-lg ${glow}`}
    >
      <Icon size={size === 'sm' ? 12 : 14} />
      <span>{level}</span>
      {size !== 'sm' && <span className="opacity-60">· {score}/100</span>}
    </motion.div>
  )
}
