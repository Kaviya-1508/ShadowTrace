const router = require('express').Router()
const auth = require('../middleware/auth')
const Node = require('../models/Node')
const Edge = require('../models/Edge')

// Get full graph for current user
router.get('/', auth, async (req, res) => {
  try {
    const [nodes, edges] = await Promise.all([
      Node.find({ user: req.user._id }),
      Edge.find({ user: req.user._id })
    ])
    res.json({ nodes, edges })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete a node and its edges
router.delete('/node/:id', auth, async (req, res) => {
  try {
    await Node.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    await Edge.deleteMany({
      user: req.user._id,
      $or: [{ source: req.params.id }, { target: req.params.id }]
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
