import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Panel,
  MarkerType, BaseEdge, EdgeLabelRenderer, getBezierPath
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GitBranch, RefreshCw, Filter, Info, X, Trash2, ZoomIn, Maximize2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import api from '../api/client'
import toast from 'react-hot-toast'

// ── Node type colours ────────────────────────────────────────────────────────
const NODE_COLORS = {
  username: { bg: '#0c1a2e', border: '#22d3ee', glow: 'rgba(34,211,238,0.4)',  text: '#cffafe',  label: 'USERNAME' },
  domain:   { bg: '#1a0c2e', border: '#a78bfa', glow: 'rgba(167,139,250,0.4)', text: '#ede9fe',  label: 'DOMAIN'   },
  ip:       { bg: '#2e1a0c', border: '#f97316', glow: 'rgba(249,115,22,0.4)',  text: '#ffedd5',  label: 'IP'       },
  email:    { bg: '#0c2e1a', border: '#34d399', glow: 'rgba(52,211,153,0.4)',  text: '#d1fae5',  label: 'EMAIL'    },
}

// ── Custom node ──────────────────────────────────────────────────────────────
function CustomNode({ data, selected }) {
  const c = NODE_COLORS[data.type] || NODE_COLORS.domain
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        background:    c.bg,
        border:        `1.5px solid ${selected ? '#fff' : c.border}`,
        borderRadius:  '12px',
        padding:       '10px 14px',
        minWidth:      '130px',
        maxWidth:      '200px',
        boxShadow:     selected
          ? `0 0 0 2px ${c.border}, 0 0 25px ${c.glow}`
          : `0 0 15px ${c.glow}`,
        cursor: 'pointer',
        transition:    'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      {/* Pulse dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
        <span style={{
          display: 'inline-block', width: '6px', height: '6px',
          borderRadius: '50%', background: c.border,
          boxShadow: `0 0 6px ${c.border}`,
          animation: 'pulse 2s infinite'
        }} />
        <span style={{ fontSize: '8px', color: c.border, fontFamily: 'monospace', letterSpacing: '0.12em', opacity: 0.9 }}>
          {c.label}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: c.text, fontFamily: 'monospace', fontWeight: 700, wordBreak: 'break-all', lineHeight: 1.4 }}>
        {data.label}
      </div>
    </motion.div>
  )
}

// ── Custom animated edge ─────────────────────────────────────────────────────
function AnimatedEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, label, markerEnd }) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: 'rgba(34,211,238,0.35)', strokeWidth: 1.5 }} />
      {/* Animated dot travelling along the edge */}
      <circle r="3" fill="#22d3ee" opacity="0.8">
        <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
      </circle>
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              fontSize: '9px',
              fontFamily: 'monospace',
              color: '#64748b',
              background: 'rgba(10,15,30,0.85)',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(34,211,238,0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = { custom: CustomNode }
const edgeTypes = { animated: AnimatedEdge }

// ── Layout: force-like grid by type ─────────────────────────────────────────
function layoutNodes(nodes) {
  const byType = {}
  nodes.forEach(n => {
    const t = n.data.type
    if (!byType[t]) byType[t] = []
    byType[t].push(n)
  })
  const types    = Object.keys(byType)
  const colWidth = 320
  const rowHeight= 130
  const positioned = []
  types.forEach((type, ti) => {
    byType[type].forEach((node, ni) => {
      // Offset every other column downward for visual interest
      const yOffset = ti % 2 === 0 ? 0 : 65
      positioned.push({
        ...node,
        position: {
          x: ti * colWidth + 80,
          y: ni * rowHeight + yOffset + 80,
        },
      })
    })
  })
  return positioned
}

// ── Main component ───────────────────────────────────────────────────────────
export default function RelationshipGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading,      setLoading]      = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [filter,       setFilter]       = useState('all')
  const [rawData,      setRawData]      = useState({ nodes: [], edges: [] })

  const fetchGraph = async () => {
    setLoading(true)
    try {
      const res = await api.get('/graph')
      const rn  = res.data.nodes || []
      const re  = res.data.edges || []
      setRawData({ nodes: rn, edges: re })
      applyFilter('all', rn, re)
      if (rn.length === 0) toast('No data yet — run some investigations first.', { icon: '🔍' })
      else toast.success(`${rn.length} nodes · ${re.length} relationships`)
    } catch {
      toast.error('Failed to load graph')
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = (f, rn = rawData.nodes, re = rawData.edges) => {
    const filtered = f === 'all' ? rn : rn.filter(n => n.type === f)
    const ids      = new Set(filtered.map(n => n._id))

    const flowNodes = layoutNodes(filtered.map(n => ({
      id:   n._id,
      type: 'custom',
      data: { label: n.value, type: n.type, metadata: n.metadata },
      position: { x: 0, y: 0 },
    })))

    const flowEdges = re
      .filter(e => ids.has(e.source) && ids.has(e.target))
      .map(e => ({
        id:         e._id,
        source:     e.source,
        target:     e.target,
        type:       'animated',
        label:      e.relationship,
        markerEnd:  { type: MarkerType.ArrowClosed, color: '#22d3ee', width: 12, height: 12 },
      }))

    setNodes(flowNodes)
    setEdges(flowEdges)
  }

  useEffect(() => { fetchGraph() }, [])

  const handleFilter = (f) => {
    setFilter(f)
    applyFilter(f)
    setSelectedNode(null)
  }

  const onNodeClick = useCallback((_, node) => setSelectedNode(node.data), [])

  const handleDeleteNode = async (nodeId) => {
    try {
      await api.delete(`/graph/node/${nodeId}`)
      toast.success('Node deleted')
      fetchGraph()
      setSelectedNode(null)
    } catch {
      toast.error('Delete failed')
    }
  }

  const typeCounts = rawData.nodes.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <PageHeader
        title="Relationship Graph"
        subtitle="Live visual map of all discovered entity connections"
        icon={GitBranch}
        color="green"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-slate-500 mr-1" />
          {['all', 'username', 'domain', 'ip', 'email'].map(f => {
            const c = NODE_COLORS[f] || { border: '#22d3ee' }
            const count = f === 'all' ? rawData.nodes.length : (typeCounts[f] || 0)
            return (
              <motion.button
                key={f}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  filter === f
                    ? 'text-white border'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
                style={filter === f ? {
                  background:   `${c.border}18`,
                  borderColor:  `${c.border}50`,
                  color:        c.border,
                } : {}}
              >
                {f}
                <span className="opacity-60 text-[10px]">{count}</span>
              </motion.button>
            )
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchGraph}
          disabled={loading}
          className="ml-auto btn-secondary flex items-center gap-2 py-2 text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </motion.button>
      </div>

      <div className="flex gap-4">
        {/* Graph canvas */}
        <div
          className="flex-1 rounded-2xl overflow-hidden border border-cyan-500/10"
          style={{ height: '620px', background: '#030712' }}
        >
          {nodes.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <GitBranch size={28} className="text-cyan-400/50" />
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-sm">No graph data yet</p>
                <p className="text-slate-600 text-xs mt-1">Run Username, Domain, or IP investigations first</p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.2}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#22d3ee" gap={45} size={0.4} style={{ opacity: 0.06 }} />
              <Controls
                style={{
                  background: 'rgba(10,15,30,0.9)',
                  border: '1px solid rgba(34,211,238,0.15)',
                  borderRadius: '10px',
                }}
              />
              <MiniMap
                nodeColor={n => NODE_COLORS[n.data?.type]?.border || '#22d3ee'}
                maskColor="rgba(3,7,18,0.85)"
                style={{
                  background: 'rgba(10,15,30,0.9)',
                  border: '1px solid rgba(34,211,238,0.15)',
                  borderRadius: '10px',
                }}
              />

              {/* Legend */}
              <Panel position="top-left">
                <div style={{
                  background: 'rgba(10,15,30,0.85)',
                  border: '1px solid rgba(34,211,238,0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px',
                }}>
                  {Object.entries(NODE_COLORS).map(([type, c]) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: c.border,
                        boxShadow: `0 0 6px ${c.border}`,
                      }} />
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {type}
                        {typeCounts[type] ? ` (${typeCounts[type]})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Node count badge */}
              <Panel position="top-right">
                <div style={{
                  background: 'rgba(10,15,30,0.85)',
                  border: '1px solid rgba(34,211,238,0.1)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: '#64748b',
                }}>
                  <span style={{ color: '#22d3ee' }}>{nodes.length}</span> nodes ·{' '}
                  <span style={{ color: '#a78bfa' }}>{edges.length}</span> edges
                </div>
              </Panel>
            </ReactFlow>
          )}
        </div>

        {/* Node detail panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 256 }}
              exit={{   opacity: 0, x: 20, width: 0 }}
              className="card h-fit shrink-0 overflow-hidden"
              style={{ width: 256 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: NODE_COLORS[selectedNode.type]?.border || '#22d3ee',
                      boxShadow: `0 0 8px ${NODE_COLORS[selectedNode.type]?.border || '#22d3ee'}`,
                    }}
                  />
                  <h3 className="text-sm font-mono text-slate-300 font-semibold">Node Detail</h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-2 rounded-lg bg-dark-800">
                  <p className="text-xs text-slate-500 font-mono mb-0.5">type</p>
                  <p className="text-sm font-mono" style={{ color: NODE_COLORS[selectedNode.type]?.border || '#22d3ee' }}>
                    {selectedNode.type}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-dark-800">
                  <p className="text-xs text-slate-500 font-mono mb-0.5">value</p>
                  <p className="text-sm text-white font-mono break-all">{selectedNode.label}</p>
                </div>

                {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                  <div className="p-2 rounded-lg bg-dark-800">
                    <p className="text-xs text-slate-500 font-mono mb-2">metadata</p>
                    {Object.entries(selectedNode.metadata).slice(0, 6).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 py-0.5">
                        <span className="text-xs font-mono text-slate-500">{k}</span>
                        <span className="text-xs font-mono text-slate-300 text-right truncate">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Connected edges */}
                {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length > 0 && (
                  <div className="p-2 rounded-lg bg-dark-800">
                    <p className="text-xs text-slate-500 font-mono mb-2">connections</p>
                    {edges
                      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                      .slice(0, 4)
                      .map((e, i) => (
                        <p key={i} className="text-xs font-mono text-cyan-400/70 py-0.5">
                          → {e.label}
                        </p>
                      ))
                    }
                  </div>
                )}

                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-400/20"
                >
                  <Trash2 size={12} />
                  Remove node
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Nodes',     value: rawData.nodes.length, color: 'text-cyan-400'   },
          { label: 'Relationships',   value: rawData.edges.length, color: 'text-violet-400' },
          { label: 'Entity Types',    value: Object.keys(typeCounts).length, color: 'text-green-400'  },
          { label: 'Investigations',  value: new Set(rawData.nodes.flatMap(n => n.discoveredIn || [])).size, color: 'text-orange-400' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card text-center py-4"
          >
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-mono mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
