import { motion } from 'framer-motion'

const steps = [
  'Initializing scan...',
  'Querying intelligence sources...',
  'Correlating data points...',
  'Building relationship map...',
  'Calculating risk score...',
  'Generating report...'
]

export default function LoadingPulse({ message = 'Scanning...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      {/* Radar animation */}
      <div className="relative w-24 h-24">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-cyan-500/40"
            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
            transition={{ duration: 2, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Scrolling steps */}
      <div className="space-y-2 text-center">
        {steps.map((step, i) => (
          <motion.p
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: [0, 1, 0.4] }}
            transition={{ delay: i * 0.5, duration: 1.5 }}
            className="text-xs font-mono text-cyan-500/60"
          >
            <span className="text-cyan-400 mr-2">▸</span>{step}
          </motion.p>
        ))}
      </div>

      <p className="text-sm text-slate-400 font-mono">{message}</p>
    </div>
  )
}
