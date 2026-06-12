const mongoose = require('mongoose')

const nodeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['username', 'domain', 'ip', 'email'], required: true },
  value: { type: String, required: true, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  discoveredIn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investigation' }]
}, { timestamps: true })

nodeSchema.index({ user: 1, value: 1, type: 1 }, { unique: true })

module.exports = mongoose.model('Node', nodeSchema)
