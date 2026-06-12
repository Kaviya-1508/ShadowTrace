const router = require('express').Router()
const axios = require('axios')
const auth = require('../middleware/auth')
const Investigation = require('../models/Investigation')
const Node = require('../models/Node')
const Edge = require('../models/Edge')

const ENGINE = process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:8000'

// FIX: Send the shared internal secret on every call to the Python engine
function engineHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (process.env.INTERNAL_SECRET) {
    headers['X-Internal-Secret'] = process.env.INTERNAL_SECRET
  }
  return headers
}

// FIX: Basic IP validation (IPv4 + IPv6)
const IPV4_RE = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/
const IPV6_RE = /^[0-9a-fA-F:]+$/
function isValidIP(ip) {
  return IPV4_RE.test(ip) || (IPV6_RE.test(ip) && ip.includes(':'))
}

async function upsertNode(userId, type, value, metadata, investigationId) {
  try {
    const node = await Node.findOneAndUpdate(
      { user: userId, type, value },
      {
        $set: { metadata },
        $addToSet: { discoveredIn: investigationId }
      },
      { upsert: true, new: true }
    )
    return node
  } catch {
    return null
  }
}

async function createEdge(userId, sourceId, targetId, relationship) {
  try {
    await Edge.findOneAndUpdate(
      { user: userId, source: sourceId, target: targetId },
      { $set: { relationship } },
      { upsert: true }
    )
  } catch {
    // Edge may already exist, that's fine
  }
}

async function correlateAndGraph(userId, type, target, data, investigationId) {
  if (type === 'username') {
    const mainNode = await upsertNode(userId, 'username', target, {}, investigationId)

    // If GitHub email was found, create email node and link it
    const ghPlatform = data.platforms?.find(p => p.platform === 'github' && p.found && p.data?.email)
    if (ghPlatform && mainNode) {
      const emailNode = await upsertNode(userId, 'email', ghPlatform.data.email, {}, investigationId)
      if (emailNode) {
        await createEdge(userId, mainNode._id, emailNode._id, 'has_email')
      }
    }
  }

  if (type === 'domain') {
    const mainNode = await upsertNode(userId, 'domain', target, { riskScore: data.riskScore }, investigationId)

    // Link A record IPs
    if (data.dns?.a?.length > 0) {
      for (const ip of data.dns.a.slice(0, 3)) {
        const ipNode = await upsertNode(userId, 'ip', ip, {}, investigationId)
        if (ipNode && mainNode) {
          await createEdge(userId, mainNode._id, ipNode._id, 'resolves_to')
        }

        // FIX: Cross-link — if this IP was already investigated, link domain → existing IP node
        const existingIpNode = await Node.findOne({ user: userId, type: 'ip', value: ip })
        if (existingIpNode && mainNode && String(existingIpNode._id) !== String(ipNode?._id)) {
          await createEdge(userId, mainNode._id, existingIpNode._id, 'resolves_to')
        }
      }
    }
  }

  if (type === 'ip') {
    const mainNode = await upsertNode(userId, 'ip', target, {
      country: data.geo?.country,
      isp: data.geo?.isp
    }, investigationId)

    // FIX: Cross-link — find domain nodes that have this IP in their DNS and link them
    if (mainNode) {
      const domainNodes = await Node.find({ user: userId, type: 'domain' })
      for (const domainNode of domainNodes) {
        // Look up the investigation for this domain to check its DNS data
        const inv = await Investigation.findOne({
          user: userId,
          type: 'domain',
          target: domainNode.value
        }).sort({ createdAt: -1 })
        if (inv?.rawData?.dns?.a?.includes(target)) {
          await createEdge(userId, domainNode._id, mainNode._id, 'resolves_to')
        }
      }
    }
  }
}

// Username
router.post('/username', auth, async (req, res) => {
  try {
    const { username } = req.body
    if (!username) return res.status(400).json({ message: 'Username required' })

    const response = await axios.post(`${ENGINE}/scan/username`, { username }, {
      timeout: 30000,
      headers: engineHeaders()
    })
    const data = response.data

    const inv = await Investigation.create({
      user: req.user._id,
      type: 'username',
      target: username,
      riskScore: data.riskScore || 0,
      riskFactors: data.riskFactors || [],
      // FIX: Strip rawData to a size-safe summary to avoid huge MongoDB documents
      rawData: {
        platforms: data.platforms,
        foundCount: data.foundCount,
        totalChecked: data.totalChecked
      },
      status: 'completed'
    })

    await correlateAndGraph(req.user._id, 'username', username, data, inv._id)

    res.json(data)
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'Intelligence engine offline. Start the Python service.' })
    }
    res.status(500).json({ message: err.message })
  }
})

// Domain
router.post('/domain', auth, async (req, res) => {
  try {
    const { domain } = req.body
    if (!domain) return res.status(400).json({ message: 'Domain required' })

    const response = await axios.post(`${ENGINE}/scan/domain`, { domain }, {
      timeout: 45000,
      headers: engineHeaders()
    })
    const data = response.data

    const inv = await Investigation.create({
      user: req.user._id,
      type: 'domain',
      target: domain,
      riskScore: data.riskScore || 0,
      riskFactors: data.riskFactors || [],
      // FIX: Store a size-safe subset (skip full subdomains list from rawData)
      rawData: {
        whois: data.whois,
        dns: data.dns,
        ssl: data.ssl,
        subdomainCount: data.subdomainCount,
        subdomains: (data.subdomains || []).slice(0, 20)
      },
      status: 'completed'
    })

    await correlateAndGraph(req.user._id, 'domain', domain, data, inv._id)

    res.json(data)
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'Intelligence engine offline. Start the Python service.' })
    }
    res.status(500).json({ message: err.message })
  }
})

// IP
router.post('/ip', auth, async (req, res) => {
  try {
    const { ip } = req.body
    if (!ip) return res.status(400).json({ message: 'IP required' })

    // FIX: Validate IP format before forwarding to engine
    if (!isValidIP(ip.trim())) {
      return res.status(400).json({ message: 'Invalid IP address format' })
    }

    const response = await axios.post(`${ENGINE}/scan/ip`, { ip }, {
      timeout: 20000,
      headers: engineHeaders()
    })
    const data = response.data

    const inv = await Investigation.create({
      user: req.user._id,
      type: 'ip',
      target: ip,
      riskScore: data.riskScore || 0,
      riskFactors: data.riskFactors || [],
      rawData: {
        geo: data.geo,
        abuse: data.abuse
      },
      status: 'completed'
    })

    await correlateAndGraph(req.user._id, 'ip', ip, data, inv._id)

    res.json(data)
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'Intelligence engine offline. Start the Python service.' })
    }
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
