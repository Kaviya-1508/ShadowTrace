const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const auth = require('../middleware/auth')

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// FIX: helper that returns only safe user fields, preventing accidental data leakage
function safeUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt
  }
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields required' })

    const exists = await User.findOne({ $or: [{ email }, { username }] })
    if (exists) return res.status(400).json({ message: 'Username or email already exists' })

    const user = await User.create({ username, email, password })
    const token = signToken(user._id)
    // FIX: use safeUser so password hash is never returned, regardless of Mongoose version
    res.status(201).json({ token, user: safeUser(user) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' })

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' })

    const token = signToken(user._id)
    res.json({ token, user: safeUser(user) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Me
router.get('/me', auth, (req, res) => res.json(req.user))

module.exports = router
