'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
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

type Org = {
  id: string
  name: string
  tier: string
  members: number
  admin: string
  seatsUsed: number
  seatsTotal: number
  created: string
}

type TierName = 'Starter' | 'Pro' | 'Studio' | 'Enterprise'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
  { id: '1', name: 'Ben Percival',   initials: 'BP', email: 'ben@example.com',   tier: 'Studio',     status: 'Active',    joined: '01 Jan 2026', lastActive: 'Today',       role: 'global_admin' },
  { id: '2', name: 'Sarah Mitchell', initials: 'SM', email: 'sarah@example.com', tier: 'Pro',        status: 'Active',    joined: '15 Feb 2026', lastActive: 'Yesterday',   role: 'org_admin' },
  { id: '3', name: 'James Walker',   initials: 'JW', email: 'james@example.com', tier: 'Starter',    status: 'Trial',     joined: '10 Jun 2026', lastActive: 'Today',       role: 'user' },
  { id: '4', name: 'Emma Davis',     initials: 'ED', email: 'emma@example.com',  tier: 'Enterprise', status: 'Active',    joined: '03 Mar 2026', lastActive: '2 days ago',  role: 'user' },
  { id: '5', name: 'Tom Hughes',     initials: 'TH', email: 'tom@example.com',   tier: 'Pro',        status: 'Trial',     joined: '11 Jun 2026', lastActive: 'Today',       role: 'user' },
  { id: '6', name: 'Priya Sharma',   initials: 'PS', email: 'priya@example.com', tier: 'Studio',     status: 'Active',    joined: '22 Apr 2026', lastActive: '3 days ago',  role: 'support' },
  { id: '7', name: 'Dan Cooper',     initials: 'DC', email: 'dan@example.com',   tier: 'Starter',    status: 'Suspended', joined: '18 May 2026', lastActive: '1 week ago',  role: 'user' },
  { id: '8', name: 'Lisa Chen',      initials: 'LC', email: 'lisa@example.com',  tier: 'Pro',        status: 'Active',    joined: '05 Jun 2026', lastActive: 'Today',       role: 'user' },
]

const MOCK_ORGS: Org[] = [
  { id: '1', name: 'Acme Productions',  tier: 'Enterprise', members: 15, admin: 'Emma Davis',     seatsUsed: 8,  seatsTotal: 15, created: 'Mar 2026' },
  { id: '2', name: 'YT Translator',     tier: 'Studio',     members: 5,  admin: 'Ben Percival',   seatsUsed: 5,  seatsTotal: 10, created: 'Jan 2026' },
  { id: '3', name: 'MediaFlow Agency',  tier: 'Pro',        members: 3,  admin: 'Sarah Mitchell', seatsUsed: 3,  seatsTotal: 5,  created: 'Apr 2026' },
  { id: '4', name: 'DevContent Ltd',    tier: 'Studio',     members: 7,  admin: 'Priya Sharma',   seatsUsed: 7,  seatsTotal: 10, created: 'May 2026' },
]

const TIER_NAMES: TierName[] = ['Starter', 'Pro', 'Studio', 'Enterprise']
const TIERS = ['Starter', 'Pro', 'Studio', 'Enterprise']
const STATUSES = ['Active', 'Trial', 'Suspended']
const ROLES = ['user', 'org_admin', 'support', 'global_admin']

const FEATURES: { key: string; label: string; note?: string; tiers: Record<TierName, boolean | string> }[] = [
  { key: 'transcribe',              label: 'Transcribe',              note: 'Starter: 5 total · Pro: 10/mo · Studio: 40/mo',   tiers: { Starter: true,  Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'credit_rollover',         label: 'Credit Rollover',         note: 'Pro + Studio: 1 month',                           tiers: { Starter: false, Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'transcript_viewer',       label: 'Transcript Viewer',                                                                 tiers: { Starter: true,  Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'timestamped_sentences',   label: 'Timestamped Sentences',                                                             tiers: { Starter: true,  Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'transcript_search',       label: 'Transcript Search',                                                                 tiers: { Starter: true,  Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'notes',                   label: 'Notes Panel',                                                                       tiers: { Starter: false, Pro: false, Studio: true,  Enterprise: true  } },
  { key: 'export_txt',              label: 'Export TXT',                                                                        tiers: { Starter: true,  Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'export_pdf',              label: 'Export PDF',                                                                        tiers: { Starter: false, Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'export_audio_video',      label: 'Export Audio / Video',    note: 'Studio ZIP includes audio + video',               tiers: { Starter: false, Pro: false, Studio: true,  Enterprise: true  } },
  { key: 'link_screenshots',        label: 'Screenshots of URL',      note: 'Pro: 5 · Studio: unlimited',                     tiers: { Starter: false, Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'folders',                 label: 'Collections / Folders',   note: 'Studio: max 10',                                  tiers: { Starter: false, Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'share_links',             label: 'Share Links',             note: 'Pro: 10-day expiry · Studio: 30-day expiry',     tiers: { Starter: false, Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'ai_chapters',             label: 'AI Chapter Markers',                                                                tiers: { Starter: false, Pro: false, Studio: true,  Enterprise: true  } },
  { key: 'scheduled_transcription', label: 'Scheduled Transcription',                                                           tiers: { Starter: false, Pro: false, Studio: true,  Enterprise: true  } },
  { key: 'transcript_correction',   label: 'Transcript Correction',                                                             tiers: { Starter: false, Pro: false, Studio: true,  Enterprise: true  } },
  { key: 'priority_processing',     label: 'Priority Processing',     note: 'Studio: paid add-on',                             tiers: { Starter: false, Pro: false, Studio: '＋',  Enterprise: true  } },
  { key: 'organisations',           label: 'Organisations',                                                                     tiers: { Starter: false, Pro: false, Studio: true,  Enterprise: true  } },
  { key: 'api_access',              label: 'API Access',                                                                        tiers: { Starter: false, Pro: false, Studio: false, Enterprise: true  } },
  { key: 'team_seats',              label: 'Team Seats',                                                                        tiers: { Starter: false, Pro: false, Studio: false, Enterprise: true  } },
]

const OVERRIDES = [
  { user: 'James Walker', feature: 'export_pdf',  direction: 'enabled',  setBy: 'admin@yt.io', date: '13 Jun 2026' },
  { user: 'Tom Hughes',   feature: 'ai_chapters', direction: 'enabled',  setBy: 'admin@yt.io', date: '12 Jun 2026' },
  { user: 'Dan Cooper',   feature: 'transcribe',  direction: 'disabled', setBy: 'admin@yt.io', date: '10 Jun 2026' },
]

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

function UserEditPanel({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (u: User) => void }) {
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
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
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
            <button style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'transparent', border: '0.5px solid rgba(229,57,53,0.3)', color: '#E53935', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
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

// ─── Org Edit Panel ───────────────────────────────────────────────────────────

function OrgEditPanel({ org, onClose, onSave }: { org: Org; onClose: () => void; onSave: (o: Org) => void }) {
  const [form, setForm] = useState({ ...org })

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
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Manage Organisation</div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>Created {org.created}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organisation Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tier</label>
            <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
              <option>Studio</option>
              <option>Enterprise</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seat Limit</label>
            <input
              type="number"
              value={form.seatsTotal}
              onChange={e => setForm(f => ({ ...f, seatsTotal: parseInt(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Org Admin</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px', background: '#111', border: '0.5px solid #2a2a2a' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{form.admin}</span>
              <button style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '4px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Change
              </button>
            </div>
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

// ─── Check component for Features tab ────────────────────────────────────────

function Check({ val }: { val: boolean }) {
  return (
    <span style={{ fontSize: '15px', fontWeight: 700, color: val ? '#22c55e' : '#E53935' }}>
      {val ? '✓' : '✗'}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'Users' | 'Organisations' | 'Features'

export default function UsersAndOrgsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Users')
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [orgs, setOrgs] = useState<Org[]>(MOCK_ORGS)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingOrg, setEditingOrg] = useState<Org | null>(null)

  function handleSaveUser(updated: User) {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
  }

  function handleSaveOrg(updated: Org) {
    setOrgs(prev => prev.map(o => o.id === updated.id ? updated : o))
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
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Users &amp; Organisations</span>
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
          {activeTab === 'Users' && (
            <button style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '6px', background: '#E53935', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              + Add user
            </button>
          )}
          {activeTab === 'Organisations' && (
            <button style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '6px', background: '#E53935', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              + New organisation
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '0.5px solid #1e1e1e', marginBottom: '20px' }}>
          {(['Users', 'Organisations', 'Features'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-0.5px',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Users tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'Users' && (
          <div>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Total Users',   value: String(users.length), sub: '+24 this week',       color: '#E53935', subColor: '#22c55e' },
                { label: 'Trial Users',   value: String(users.filter(u => u.status === 'Trial').length), sub: '27% convert to paid', color: '#333', subColor: '#888' },
                { label: 'Paid Users',    value: String(users.filter(u => u.status === 'Active').length), sub: '69% of total',       color: '#22c55e', subColor: '#22c55e' },
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
                <option>All tiers</option><option>Explorer</option><option>Creator</option><option>Studio</option><option>Enterprise</option>
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
                    <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '0.5px solid #141414' : 'none' }}>
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
                          <button onClick={() => setEditingUser(user)}
                            style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            Edit
                          </button>
                          {user.status === 'Suspended' ? (
                            <button onClick={() => setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'Active' } : u))}
                              style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.3)', color: '#22c55e', cursor: 'pointer' }}>
                              Unsuspend
                            </button>
                          ) : (
                            <button onClick={() => setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'Suspended' } : u))}
                              style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'transparent', border: '0.5px solid rgba(229,57,53,0.3)', color: '#E53935', cursor: 'pointer' }}>
                              Suspend
                            </button>
                          )}
                          <button style={{ fontSize: '13px', color: '#555', background: 'transparent', border: 'none', cursor: 'pointer' }}>⋯</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Organisations tab ──────────────────────────────────────────────── */}
        {activeTab === 'Organisations' && (
          <div>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #E53935' }}>
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Total Orgs</div>
                <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>{orgs.length}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Across all tiers</div>
              </div>
              <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #22c55e' }}>
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Active Orgs</div>
                <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>{orgs.length}</div>
                <div style={{ fontSize: '11px', color: '#22c55e' }}>100% active rate</div>
              </div>
              <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #333' }}>
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Enterprise Orgs</div>
                <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>{orgs.filter(o => o.tier === 'Enterprise').length}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Top tier</div>
              </div>
            </div>

            {/* Org cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {orgs.map((org) => {
                const seatPct = Math.round((org.seatsUsed / org.seatsTotal) * 100)
                return (
                  <div key={org.id} style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{org.name}</div>
                        {tierBadge(org.tier)}
                      </div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1a1a1a', border: '0.5px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                        🏢
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>Members</div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{org.members}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>Org Admin</div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{org.admin}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>Created</div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{org.created}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#555' }}>Seat usage</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{org.seatsUsed}/{org.seatsTotal} seats</span>
                      </div>
                      <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${seatPct}%`, background: seatPct > 80 ? '#E53935' : '#22c55e', borderRadius: '2px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setEditingOrg(org)}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#E53935', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        Manage
                      </button>
                      <button style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'transparent', color: 'var(--text-secondary)', border: '0.5px solid #2a2a2a', cursor: 'pointer', fontSize: '12px' }}>
                        View users
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Features tab ───────────────────────────────────────────────────── */}
        {activeTab === 'Features' && (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', marginTop: 0 }}>
              Override features per tier or per individual user. Changes take effect immediately.
            </p>

            {/* Tier defaults table */}
            <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🏷️</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Tier Defaults</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '220px' }}>Feature</th>
                    {TIER_NAMES.map(t => (
                      <th key={t} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f, i) => (
                    <tr key={f.key} style={{ borderBottom: i < FEATURES.length - 1 ? '0.5px solid #141414' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{f.label}</td>
                      {TIER_NAMES.map(t => (
                        <td key={t} style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <Check val={!!f.tiers[t]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* User overrides */}
            <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px' }}>👤</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>User Overrides</span>
              </div>
              <input type="text" placeholder="Find user to override..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#141414', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {OVERRIDES.map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '6px', background: '#141414', border: '0.5px solid #1e1e1e' }}>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '120px' }}>{o.user}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', minWidth: '120px' }}>{o.feature}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, background: o.direction === 'enabled' ? 'rgba(34,197,94,0.1)' : 'rgba(229,57,53,0.1)', color: o.direction === 'enabled' ? '#22c55e' : '#E53935' }}>{o.direction}</span>
                      <span style={{ fontSize: '12px', color: '#555' }}>by {o.setBy} · {o.date}</span>
                    </div>
                    <button style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.3)', color: '#E53935', cursor: 'pointer' }}>
                      Remove override
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over panels */}
      {editingUser && (
        <UserEditPanel user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />
      )}
      {editingOrg && (
        <OrgEditPanel org={editingOrg} onClose={() => setEditingOrg(null)} onSave={handleSaveOrg} />
      )}
    </div>
  )
}
