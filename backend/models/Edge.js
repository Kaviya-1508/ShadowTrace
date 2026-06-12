const mongoose = require('mongoose')

const edgeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
  relationship: { type: String, required: true },
  confidence: { type: Number, default: 1.0, min: 0, max: 1 }
}, { timestamps: true })

edgeSchema.index({ user: 1, source: 1, target: 1 }, { unique: true })

module.exports = mongoose.model('Edge', edgeSchema)
