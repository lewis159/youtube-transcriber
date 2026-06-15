'use client'

import { useState } from 'react'
import type { RoadmapItem as RoadmapItemBase } from '@/lib/supabase'

type Status = 'completed' | 'in_progress' | 'pending' | 'future'
type Priority = 'critical' | 'high' | 'medium' | 'low' | 'nice_to_have' | 'op_security'
type Category = 'security' | 'core' | 'prelaunch' | 'admin' | 'v2' | 'sentinel'

interface RoadmapItem extends RoadmapItemBase {
  status: Status
  priority: Priority
  category: Category
}

const STATUS_STYLE: Record<Status, { label: string; color: string; bg: string; border: string; dot: string }> = {
  completed:   { label: 'Completed',   color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   dot: '#22c55e' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  dot: '#f59e0b' },
  pending:     { label: 'Pending',     color: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.2)',   dot: '#60a5fa' },
  future:      { label: 'Future',      color: '#555',    bg: 'rgba(255,255,255,0.02)', border: '#222',                   dot: '#444' },
}

const PRIORITY_STYLE: Record<Priority, { label: string; color: string; bg: string; border: string; leftBorder: string }> = {
  critical:     { label: 'Critical',     color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   leftBorder: '#ef4444' },
  high:         { label: 'High',         color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  leftBorder: '#f59e0b' },
  medium:       { label: 'Medium',       color: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.2)',   leftBorder: '#60a5fa' },
  low:          { label: 'Low',          color: '#888',    bg: 'rgba(255,255,255,0.04)', border: '#333',                   leftBorder: '#333' },
  nice_to_have: { label: 'Nice to Have', color: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.2)', leftBorder: '#2a2a2a' },
  op_security:  { label: 'Op Security',  color: '#a855f7', bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.25)',  leftBorder: '#a855f7' },
}

const CATEGORIES: { key: Category; label: string; description: string }[] = [
  { key: 'security',  label: 'Security',        description: 'Must fix before any real users' },
  { key: 'core',      label: 'Core Product',    description: 'The app doesn\'t transcribe yet' },
  { key: 'prelaunch', label: 'Pre-Launch',       description: 'Required before going live' },
  { key: 'admin',     label: 'Admin Portal',     description: 'Polish & tooling improvements' },
  { key: 'v2',        label: 'Nice to Have',     description: 'Future features & v2 ideas' },
  { key: 'sentinel',  label: 'Op Security',      description: 'Operations & Security Console (Sentinel) — full build list' },
]

export default function RoadmapClient({ roadmap }: { roadmap: RoadmapItem[] }) {
  const completed   = roadmap.filter(i => i.status === 'completed').length
  const total       = roadmap.length

  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null)
  const [statusFilter, setStatusFilter] = useState<Status | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null)

  const filterActive = priorityFilter !== null || statusFilter !== null || categoryFilter !== null
  const matches = (i: RoadmapItem) =>
    (priorityFilter === null || i.priority === priorityFilter) &&
    (statusFilter === null || i.status === statusFilter) &&
    (categoryFilter === null || i.category === categoryFilter)
  const visibleCount = roadmap.filter(matches).length

  const clearFilters = () => { setPriorityFilter(null); setStatusFilter(null); setCategoryFilter(null) }

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>

      {/* Sub-header bar */}
      <div style={{
        background: '#0d0d0d',
        borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '60px',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Build Roadmap</span>
          <span style={{ fontSize: '11px', color: '#22c55e', fontFamily: 'monospace', background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
            {completed}/{total} done
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>{today}</span>
      </div>

      <div style={{ padding: '24px' }}>

        {/* Filter bar: Priority (left) · Status (right) */}
        <div style={{
          background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        }}>
          {/* Priority chips (left) */}
          <span style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginRight: '4px' }}>Priority</span>
          {(['critical', 'high', 'medium', 'low', 'nice_to_have', 'op_security'] as Priority[]).map(p => {
            const ps = PRIORITY_STYLE[p]
            const active = priorityFilter === p
            return (
              <div
                key={p}
                onClick={() => setPriorityFilter(active ? null : p)}
                role="button"
                tabIndex={0}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  cursor: 'pointer',
                  padding: '4px 9px',
                  borderRadius: '5px',
                  background: active ? ps.bg : 'transparent',
                  border: active ? `0.5px solid ${ps.border}` : '0.5px solid transparent',
                  outline: active ? `1px solid ${ps.color}` : 'none',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: ps.leftBorder }} />
                <span style={{ fontSize: '12px', color: ps.color }}>{ps.label}</span>
              </div>
            )
          })}

          {/* Category chips (middle) */}
          <span style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginLeft: '8px', marginRight: '4px' }}>Category</span>
          {CATEGORIES.map(({ key, label }) => {
            const active = categoryFilter === key
            return (
              <div
                key={key}
                onClick={() => setCategoryFilter(active ? null : key)}
                role="button"
                tabIndex={0}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  cursor: 'pointer',
                  padding: '4px 9px',
                  borderRadius: '5px',
                  background: active ? 'rgba(96,165,250,0.06)' : 'transparent',
                  border: active ? '0.5px solid rgba(96,165,250,0.2)' : '0.5px solid transparent',
                  outline: active ? '1px solid #60a5fa' : 'none',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: active ? '#60a5fa' : '#444' }} />
                <span style={{ fontSize: '12px', color: active ? '#60a5fa' : '#888' }}>{label}</span>
              </div>
            )
          })}

          {/* Status chips (right) */}
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginRight: '4px' }}>Status</span>
          {(['completed', 'in_progress', 'pending', 'future'] as Status[]).map(s => {
            const ss = STATUS_STYLE[s]
            const active = statusFilter === s
            return (
              <div
                key={s}
                onClick={() => setStatusFilter(active ? null : s)}
                role="button"
                tabIndex={0}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  cursor: 'pointer',
                  padding: '4px 9px',
                  borderRadius: '5px',
                  background: active ? ss.bg : 'transparent',
                  border: active ? `0.5px solid ${ss.border}` : '0.5px solid transparent',
                  outline: active ? `1px solid ${ss.color}` : 'none',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: ss.dot }} />
                <span style={{ fontSize: '12px', color: ss.color }}>{ss.label}</span>
              </div>
            )
          })}
        </div>

        {/* Filter affordance */}
        {filterActive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '16px',
          }}>
            <span style={{ fontSize: '12px', color: '#888' }}>
              Showing {visibleCount} of {total} items
            </span>
            <button
              onClick={clearFilters}
              style={{
                fontSize: '11px', color: '#888',
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid #333',
                borderRadius: '5px',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              Clear filters ✕
            </button>
          </div>
        )}

        {/* Category sections */}
        {CATEGORIES.map(({ key, label, description }) => {
          const items = roadmap.filter(i => i.category === key && matches(i))
          // Hide a section entirely if it has no items under the active filters.
          if (items.length === 0) return null
          return (
            <div key={key} style={{ marginBottom: '28px' }}>

              {/* Section header (plain label) */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '4px 8px',
                  margin: '0 -8px 12px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                <span style={{ fontSize: '11px', color: '#333', whiteSpace: 'nowrap' }}>— {description}</span>
                <div style={{ flex: 1, height: '0.5px', background: '#1e1e1e' }} />
                <span style={{ fontSize: '11px', color: '#444', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{items.length} items</span>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map(item => {
                  const ps = PRIORITY_STYLE[item.priority]
                  const ss = STATUS_STYLE[item.status]
                  const isComplete = item.status === 'completed'
                  return (
                    <div key={item.id} style={{
                      background: '#0d0d0d',
                      border: '0.5px solid #1e1e1e',
                      borderLeft: `3px solid ${ps.leftBorder}`,
                      borderRadius: '6px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      opacity: isComplete ? 0.6 : 1,
                    }}>
                      {/* ID */}
                      <span style={{ fontSize: '11px', color: '#444', fontFamily: 'monospace', flexShrink: 0, marginTop: '2px', width: '28px' }}>
                        #{item.id}
                      </span>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '13px', fontWeight: 600,
                            color: isComplete ? '#555' : 'var(--text-primary)',
                            textDecoration: isComplete ? 'line-through' : 'none',
                          }}>
                            {item.title}
                          </span>
                          {/* Priority badge */}
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '3px',
                            color: ps.color, background: ps.bg, border: `0.5px solid ${ps.border}`,
                            flexShrink: 0,
                          }}>
                            {ps.label}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#555', margin: 0, lineHeight: '1.55' }}>
                          {item.description}
                        </p>
                      </div>

                      {/* Right side: status + date */}
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '3px',
                          color: ss.color, background: ss.bg, border: `0.5px solid ${ss.border}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {ss.label}
                        </span>
                        <span style={{ fontSize: '10px', color: '#444', fontFamily: 'monospace' }}>{item.updatedAt}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div style={{ fontSize: '11px', color: '#333', fontFamily: 'monospace', marginTop: '8px' }}>
          {roadmap.length} total items · last updated 2026-06-14 · global admin only
        </div>
      </div>
    </div>
  )
}
