const router = require('express').Router()
const auth = require('../middleware/auth')
const Investigation = require('../models/Investigation')

// Get all investigations for user
router.get('/', auth, async (req, res) => {
  try {
    // FIX: Cap limit to prevent dumping entire DB via ?limit=999999
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const investigations = await Investigation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
    res.json({ investigations })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get stats
router.get('/stats', auth, async (req, res) => {
  try {
    const [total, usernames, domains, ips] = await Promise.all([
      Investigation.countDocuments({ user: req.user._id }),
      Investigation.countDocuments({ user: req.user._id, type: 'username' }),
      Investigation.countDocuments({ user: req.user._id, type: 'domain' }),
      Investigation.countDocuments({ user: req.user._id, type: 'ip' })
    ])
    res.json({ total, usernames, domains, ips })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete one
router.delete('/:id', auth, async (req, res) => {
  try {
    await Investigation.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
