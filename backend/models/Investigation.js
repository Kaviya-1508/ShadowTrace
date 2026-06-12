const mongoose = require('mongoose')

const investigationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['username', 'domain', 'ip'], required: true },
  target: { type: String, required: true, trim: true },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  riskFactors: [String],
  rawData: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['completed', 'failed'], default: 'completed' }
}, { timestamps: true })

investigationSchema.index({ user: 1, createdAt: -1 })
investigationSchema.index({ type: 1 })

module.exports = mongoose.model('Investigation', investigationSchema)
