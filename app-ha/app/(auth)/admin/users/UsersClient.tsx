'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = {
  id: string
  name: string
  initials: string
  email: string
  tier: string
  status: string
  joined: string
  lastActive: string
  role: string
}

const TIERS = ['Starter', 'Pro', 'Studio', 'Enterprise']
const STATUSES = ['Active', 'Trial', 'Suspended']
const ROLES = ['user', 'org_admin', 'support', 'global_admin']

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function tierBadge(tier: string) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    Starter:    { bg: 'rgba(255,255,255,0.05)', color: '#888',    border: '#333' },
    Pro:        { bg: 'rgba(229,57,53,0.08)',   color: '#E53935', border: 'rgba(229,57,53,0.2)' },
    Studio:     { bg: 'rgba(229,57,53,0.15)',   color: '#ff6b6b', border: 'rgba(229,57,53,0.35)' },
    Enterprise: { bg: 'rgba(229,57,53,0.25)',   color: '#ff8a80', border: 'rgba(229,57,53,0.5)' },
  }
  const s = styles[tier] || styles.Starter
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, fontWeight: 600 }}>
      {tier}
    </span>
  )
}

function statusBadge(status: string) {
  const styles: Record<string, { bg: string; color: string }> = {
    Active:    { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' },
    Trial:     { bg: 'rgba(234,179,8,0.1)',  color: '#eab308' },
    Suspended: { bg: 'rgba(229,57,53,0.1)',  color: '#E53935' },
  }
  const s = styles[status] || styles.Active
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: s.bg, color: s.color, fontWeight: 600 }}>
      {status}
    </span>
  )
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    global_admin: 'Global Admin',
    org_admin: 'Org Admin',
    support: 'Support',
    user: 'User',
  }
  return map[role] || role
}

// ─── User Edit Panel ──────────────────────────────────────────────────────────

function UserEditPanel({ user, onClose, onSave, onDelete }: { user: User; onClose: () => void; onSave: (u: User) => void; onDelete: (u: User) => void }) {
  const [form, setForm] = useState({ ...user })

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px',
        background: '#0d0d0d', borderLeft: '0.5px solid #2a2a2a',
        zIndex: 101, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Edit User</div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{user.email}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '24px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1a1a1a', border: '0.5px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#666' }}>
            {user.initials}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>Joined {user.joined}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tier</label>
            <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
              {TIERS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
              {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </div>

          <div style={{ marginTop: '8px', padding: '16px', border: '0.5px solid rgba(229,57,53,0.2)', borderRadius: '8px', background: 'rgba(229,57,53,0.03)' }}>
            <div style={{ fontSize: '11px', color: '#E53935', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Danger Zone</div>
            <button onClick={() => { onDelete(user); onClose() }}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'transparent', border: '0.5px solid rgba(229,57,53,0.3)', color: '#E53935', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
              Delete Account
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '0.5px solid #1e1e1e', display: 'flex', gap: '10px' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '9px', borderRadius: '6px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => { onSave(form); onClose() }}
            style={{ flex: 1, padding: '9px', borderRadius: '6px', background: '#E53935', border: 'none', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
            Save Changes
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export default function UsersAndOrgsClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function patchUser(id: string, body: Partial<Pick<User, 'tier' | 'role' | 'status'>>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Request failed (${res.status})`)
    }
  }

  async function handleSaveUser(updated: User) {
    const prev = users
    // Optimistic update.
    setUsers(p => p.map(u => u.id === updated.id ? updated : u))
    setError(null)
    try {
      await patchUser(updated.id, { tier: updated.tier, role: updated.role, status: updated.status })
    } catch (e: any) {
      setUsers(prev) // rollback
      setError(e.message)
    }
  }

  async function handleToggleSuspend(user: User) {
    const next = user.status === 'Suspended' ? 'Active' : 'Suspended'
    const prev = users
    setBusyId(user.id)
    setUsers(p => p.map(u => u.id === user.id ? { ...u, status: next } : u))
    setError(null)
    try {
      await patchUser(user.id, { status: next })
    } catch (e: any) {
      setUsers(prev)
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return
    const prev = users
    setBusyId(user.id)
    setUsers(p => p.filter(u => u.id !== user.id))
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }
    } catch (e: any) {
      setUsers(prev)
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const roleCounts = {
    global_admin: users.filter(u => u.role === 'global_admin').length,
    support: users.filter(u => u.role === 'support').length,
    org_admin: users.filter(u => u.role === 'org_admin').length,
    user: users.filter(u => u.role === 'user').length,
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
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Users</span>
          <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {roleCounts.global_admin > 0 && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(229,57,53,0.08)', color: '#E53935', border: '0.5px solid rgba(229,57,53,0.2)' }}>
              {roleCounts.global_admin} Global Admin{roleCounts.global_admin !== 1 ? 's' : ''}
            </span>
          )}
          {roleCounts.support > 0 && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '0.5px solid rgba(59,130,246,0.2)' }}>
              {roleCounts.support} Support
            </span>
          )}
          {roleCounts.org_admin > 0 && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '0.5px solid rgba(245,158,11,0.2)' }}>
              {roleCounts.org_admin} Org Admin{roleCounts.org_admin !== 1 ? 's' : ''}
            </span>
          )}
          <button style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '6px', background: '#E53935', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            + Add user
          </button>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Cross-links to the canonical standalone admin pages */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <Link href="/admin/organisations" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Organisations →
          </Link>
          <Link href="/admin/feature-flags" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Feature Flags →
          </Link>
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '6px', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.3)', color: '#E53935', fontSize: '12px' }}>
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total Users',   value: String(users.length), sub: 'All registered accounts', color: '#E53935', subColor: '#888' },
            { label: 'Trial Users',   value: String(users.filter(u => u.status === 'Trial').length), sub: 'Awaiting conversion', color: '#333', subColor: '#888' },
            { label: 'Paid Users',    value: String(users.filter(u => u.status === 'Active').length), sub: 'Active subscriptions', color: '#22c55e', subColor: '#22c55e' },
            { label: 'Global Admins', value: String(roleCounts.global_admin), sub: 'Full access',          color: '#333', subColor: '#888' },
          ].map(({ label, value, sub, color, subColor }) => (
            <div key={label} style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: `2px solid ${color}` }}>
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>{label}</div>
              <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>{value}</div>
              <div style={{ fontSize: '11px', color: subColor }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Search/filter bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input type="text" placeholder="Search by name or email..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
          <select style={{ padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', fontSize: '13px', outline: 'none' }}>
            <option>All tiers</option><option>Starter</option><option>Pro</option><option>Studio</option><option>Enterprise</option>
          </select>
          <select style={{ padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', fontSize: '13px', outline: 'none' }}>
            <option>All</option><option>Trial</option><option>Active</option><option>Suspended</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #1e1e1e' }}>
                {['User', 'Email', 'Tier', 'Status', 'Joined', 'Last Active', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '0.5px solid #141414' : 'none', opacity: busyId === user.id ? 0.5 : 1 }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1a1a1a', border: '0.5px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#888', flexShrink: 0 }}>
                        {user.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{user.name}</div>
                        {user.role === 'global_admin' && <div style={{ fontSize: '10px', color: '#E53935', marginTop: '1px' }}>Global Admin</div>}
                        {user.role === 'support' && <div style={{ fontSize: '10px', color: '#60a5fa', marginTop: '1px' }}>Support</div>}
                        {user.role === 'org_admin' && <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '1px' }}>Org Admin</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px' }}>{tierBadge(user.tier)}</td>
                  <td style={{ padding: '12px 16px' }}>{statusBadge(user.status)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{user.joined}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{user.lastActive}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => setEditingUser(user)} disabled={busyId === user.id}
                        style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        Edit
                      </button>
                      {user.status === 'Suspended' ? (
                        <button onClick={() => handleToggleSuspend(user)} disabled={busyId === user.id}
                          style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.3)', color: '#22c55e', cursor: 'pointer' }}>
                          Unsuspend
                        </button>
                      ) : (
                        <button onClick={() => handleToggleSuspend(user)} disabled={busyId === user.id}
                          style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'transparent', border: '0.5px solid rgba(229,57,53,0.3)', color: '#E53935', cursor: 'pointer' }}>
                          Suspend
                        </button>
                      )}
                      <button onClick={() => handleDeleteUser(user)} disabled={busyId === user.id}
                        style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'transparent', border: '0.5px solid rgba(229,57,53,0.3)', color: '#E53935', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over panel */}
      {editingUser && (
        <UserEditPanel user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} onDelete={handleDeleteUser} />
      )}
    </div>
  )
}
