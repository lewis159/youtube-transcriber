'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ChangelogEntry } from '@/lib/supabase'

const PER_PAGE = 2

const btnBase: React.CSSProperties = {
  padding: '7px 18px',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  background: 'transparent',
  border: '0.5px solid #2a2a2a',
  color: 'var(--text-secondary)',
  transition: 'all 0.15s',
}

const btnDisabled: React.CSSProperties = {
  ...btnBase,
  opacity: 0.35,
  cursor: 'not-allowed',
}

const smallBtn: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  cursor: 'pointer',
  background: 'transparent',
  border: '0.5px solid #2a2a2a',
  color: 'var(--text-secondary)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0d0d0d',
  border: '0.5px solid #2a2a2a',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  padding: '8px 10px',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#888',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '6px',
  display: 'block',
}

// Working shape for the form: text-list fields are edited as newline-joined strings.
interface FormState {
  id: string | null
  version: string
  label: string
  date: string
  borderColor: string
  isCurrent: boolean
  newFeatures: string
  changes: string
  removed: string
}

const EMPTY_FORM: FormState = {
  id: null,
  version: '',
  label: '',
  date: '',
  borderColor: '#2a2a2a',
  isCurrent: false,
  newFeatures: '',
  changes: '',
  removed: '',
}

function entryToForm(v: ChangelogEntry): FormState {
  return {
    id: v.id,
    version: v.version,
    label: v.label ?? '',
    date: v.date ?? '',
    borderColor: v.borderColor ?? '#2a2a2a',
    isCurrent: v.isCurrent,
    newFeatures: v.newFeatures.join('\n'),
    changes: v.changes.join('\n'),
    removed: v.removed.join('\n'),
  }
}

function linesToArray(s: string): string[] {
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

export default function ChangelogClient({ versions }: { versions: ChangelogEntry[] }) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Render newest-first using the DB sort_order. getChangelogEntries() already
  // returns rows ordered by sort_order ascending (newest = lowest/most-negative),
  // so we preserve that order rather than re-sorting by the date string.
  const sortedVersions = versions

  const totalPages = Math.max(1, Math.ceil(sortedVersions.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginatedVersions = sortedVersions.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function openCreate() {
    setError(null)
    setForm({ ...EMPTY_FORM })
  }

  function openEdit(v: ChangelogEntry) {
    setError(null)
    setForm(entryToForm(v))
  }

  function closeForm() {
    setForm(null)
    setError(null)
  }

  async function save() {
    if (!form) return
    if (!form.version.trim()) {
      setError('Version is required')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      id: form.id ?? undefined,
      version: form.version.trim(),
      label: form.label,
      date: form.date,
      borderColor: form.borderColor,
      isCurrent: form.isCurrent,
      newFeatures: linesToArray(form.newFeatures),
      changes: linesToArray(form.changes),
      removed: linesToArray(form.removed),
    }

    try {
      const res = await fetch('/api/admin/changelog', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Save failed')
        setSaving(false)
        return
      }
      setForm(null)
      setSaving(false)
      router.refresh()
    } catch {
      setError('Network error')
      setSaving(false)
    }
  }

  async function remove(v: ChangelogEntry) {
    if (!confirm(`Delete changelog entry ${v.version}? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/changelog?id=${encodeURIComponent(v.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json.error || 'Delete failed')
        return
      }
      router.refresh()
    } catch {
      alert('Network error')
    }
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Version History</span>
          <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
        </div>
        <button
          onClick={openCreate}
          style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '6px', background: 'transparent', color: 'var(--text-secondary)', border: '0.5px solid #2a2a2a', cursor: 'pointer' }}
        >
          + Add version
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Create / edit form */}
          {form && (
            <div style={{
              background: '#0d0d0d',
              border: '0.5px solid #2a2a2a',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>
                {form.id ? 'Edit version' : 'New version'}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Version</label>
                  <input style={inputStyle} value={form.version} placeholder="0.2.0"
                    onChange={(e) => setForm({ ...form, version: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Label</label>
                  <input style={inputStyle} value={form.label} placeholder="Beta"
                    onChange={(e) => setForm({ ...form, label: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Date</label>
                  <input style={inputStyle} value={form.date} placeholder="19 June 2026"
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Border colour</label>
                  <input style={inputStyle} value={form.borderColor} placeholder="#E53935"
                    onChange={(e) => setForm({ ...form, borderColor: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>New features (one per line)</label>
                <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.newFeatures}
                  onChange={(e) => setForm({ ...form, newFeatures: e.target.value })} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Changes (one per line)</label>
                <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.changes}
                  onChange={(e) => setForm({ ...form, changes: e.target.value })} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Removed (one per line)</label>
                <textarea style={{ ...inputStyle, minHeight: '50px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.removed}
                  onChange={(e) => setForm({ ...form, removed: e.target.value })} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.isCurrent}
                  onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} />
                Mark as current (clears the current flag on all other versions)
              </label>

              {error && (
                <div style={{ fontSize: '12px', color: '#E53935', marginBottom: '14px' }}>{error}</div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={save}
                  disabled={saving}
                  style={{ ...btnBase, background: '#E53935', borderColor: '#E53935', color: '#fff', opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create version'}
                </button>
                <button onClick={closeForm} disabled={saving} style={btnBase}>Cancel</button>
              </div>
            </div>
          )}

          {paginatedVersions.map(v => (
            <div
              key={v.id}
              style={{
                background: '#0d0d0d',
                border: '0.5px solid #1e1e1e',
                borderRadius: '8px',
                borderLeft: `3px solid ${v.borderColor ?? '#2a2a2a'}`,
                padding: '24px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{v.version}</span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{v.label}</span>
                {v.isCurrent && (
                  <span style={{ fontSize: '11px', color: '#E53935', background: 'rgba(229,57,53,0.1)', border: '0.5px solid rgba(229,57,53,0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>CURRENT</span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(v)} style={smallBtn}>Edit</button>
                  <button onClick={() => remove(v)} style={{ ...smallBtn, color: '#E53935', borderColor: 'rgba(229,57,53,0.3)' }}>Delete</button>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '20px', fontFamily: 'monospace' }}>{v.date}</div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: v.isCurrent ? '#E53935' : '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>New Features</div>
                {v.newFeatures.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: v.isCurrent ? '#E53935' : '#555', marginTop: '1px', flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Changes</div>
                {v.changes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#555', marginTop: '1px', flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c}</span>
                  </div>
                ))}
              </div>

              {v.removed.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Removed</div>
                  {v.removed.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#f59e0b', marginTop: '1px', flexShrink: 0 }}>−</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
            <button
              disabled={safePage === 1}
              onClick={() => setPage(p => p - 1)}
              style={safePage === 1 ? btnDisabled : btnBase}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page {safePage} of {totalPages}
            </span>
            <button
              disabled={safePage === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={safePage === totalPages ? btnDisabled : btnBase}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
