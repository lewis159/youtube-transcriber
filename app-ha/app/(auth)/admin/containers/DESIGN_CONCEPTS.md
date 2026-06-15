# Container Control Panel — Design Concepts

Two visual approaches for adding container control actions (start, stop, pause, delete) to the admin containers page.

Both designs share the same core security model and filtering approach, differing only in layout.

---

## Shared Architecture

### Security Password Flow

A separate `ADMIN_ACTION_PASSWORD` env var (stored as a bcrypt hash, e.g. `ADMIN_ACTION_PASSWORD_HASH`) is checked server-side on every destructive action.

**API route:** `POST /api/admin/containers/[id]/action`

```ts
// app/api/admin/containers/[id]/action/route.ts
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { action, password } = await req.json()
  // Verify action password (separate from admin login)
  const hash = process.env.ADMIN_ACTION_PASSWORD_HASH ?? ''
  const valid = await bcrypt.compare(password, hash)
  if (!valid) return NextResponse.json({ error: 'Invalid action password' }, { status: 403 })

  // Send action to Docker socket
  const endpoint = {
    start:  `/v1.44/containers/${params.id}/start`,
    stop:   `/v1.44/containers/${params.id}/stop`,
    pause:  `/v1.44/containers/${params.id}/pause`,
    delete: `/v1.44/containers/${params.id}`,
  }[action]

  if (!endpoint) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  // ... dockerRequest(endpoint, method: action === 'delete' ? 'DELETE' : 'POST')
  return NextResponse.json({ ok: true })
}
```

### Label Filtering

Docker containers belonging to this project are identified by:
- Docker label `com.docker.compose.project=yt-transcriber`, OR
- Container name starting with `yt-transcriber_` or `yt_transcriber_`

The API route (`GET /api/admin/containers`) already returns all containers. Filtering happens client-side by checking `Labels['com.docker.compose.project']` or the name prefix. A UI control lets the admin toggle the filter on/off or select specific label values.

---

## Design A — Inline Action Row

### Layout Approach

Each container row in the table gets four inline action buttons appended as a rightmost column. The buttons are compact icon+label style. A label/project filter dropdown sits at the top of the page above the container groups.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Container Monitor  [ALPHA]              [ Project: yt-transcriber ▼ ] [↻]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ APP  3 containers                                                            │
├──────────────────┬──────────┬────────────────┬────────┬─────────────────────┤
│ Name             │ Status   │ Uptime         │ Ports  │ Actions             │
├──────────────────┼──────────┼────────────────┼────────┼─────────────────────┤
│ yt-transcriber_  │ running  │ Up 3 hours     │ 3000→  │ [▶][⏸][⏹][🗑]     │
│ app_1            │          │                │ 3000   │                     │
├──────────────────┼──────────┼────────────────┼────────┼─────────────────────┤
│ yt-transcriber_  │ exited   │ Exited 2h ago  │  —     │ [▶][⏸][⏹][🗑]     │
│ worker_1         │          │                │        │                     │
└──────────────────┴──────────┴────────────────┴────────┴─────────────────────┘

  ┌─────────────────────────────────────────┐
  │  Security Check                     ✕  │  ← modal overlay on action click
  │  Enter action password to continue      │
  │  ┌─────────────────────────────────┐   │
  │  │ ••••••••                        │   │
  │  └─────────────────────────────────┘   │
  │  Action: Stop  Container: app_1         │
  │              [Cancel]  [Confirm Stop]   │
  └─────────────────────────────────────────┘
```

### Security Password Flow

Clicking any action button (▶ / ⏸ / ⏹ / 🗑) opens a centered modal overlay. The modal shows which container and which action is pending. The admin types the action password and clicks Confirm. The password is sent with the action to `POST /api/admin/containers/[id]/action` and verified server-side via bcrypt against `ADMIN_ACTION_PASSWORD_HASH`. If wrong, an inline error appears in the modal. The modal never caches the password — it must be re-entered for each action.

### Label Filter

A single `<select>` dropdown at the top of the page. Options: "All containers", "yt-transcriber (project label)", "Other". Selecting an option filters the rendered container groups client-side. The dropdown reads available values from `Labels['com.docker.compose.project']` across all returned containers and populates options dynamically.

### JSX Sketch

```tsx
// Design A — Inline Action Row sketch

function ContainersPageA() {
  const [projectFilter, setProjectFilter] = useState('yt-transcriber')
  const [pendingAction, setPendingAction] = useState<{
    containerId: string; containerName: string; action: 'start'|'stop'|'pause'|'delete'
  } | null>(null)
  const [actionPassword, setActionPassword] = useState('')
  const [actionError, setActionError] = useState('')

  const filteredContainers = containers.filter(c =>
    projectFilter === 'all'
      ? true
      : c.Labels?.['com.docker.compose.project'] === projectFilter
        || c.Names?.[0]?.startsWith(`/${projectFilter}`)
  )

  async function confirmAction() {
    const res = await fetch(`/api/admin/containers/${pendingAction!.containerId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action: pendingAction!.action, password: actionPassword }),
    })
    if (!res.ok) { setActionError('Invalid password'); return }
    setPendingAction(null)
    setActionPassword('')
    fetchContainers()
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#888' }}>Project:</label>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
          <option value="all">All containers</option>
          <option value="yt-transcriber">yt-transcriber</option>
        </select>
      </div>

      {/* Container table — one per group */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th><th>Status</th><th>Uptime</th><th>Ports</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredContainers.map(c => (
            <tr key={c.Id}>
              <td>{c.Names[0]}</td>
              <td>{statusBadge(c.State, c.Status)}</td>
              <td>{c.Status}</td>
              <td>{formatPorts(c.Ports)}</td>
              <td style={{ display: 'flex', gap: 4 }}>
                {['start','pause','stop','delete'].map(action => (
                  <button key={action}
                    onClick={() => setPendingAction({ containerId: c.Id, containerName: c.Names[0], action: action as never })}
                    style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                      background: action === 'delete' ? 'rgba(229,57,53,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `0.5px solid ${action === 'delete' ? 'rgba(229,57,53,0.3)' : '#2a2a2a'}`,
                      color: action === 'delete' ? '#E53935' : '#aaa' }}>
                    {action === 'start' ? '▶' : action === 'pause' ? '⏸' : action === 'stop' ? '⏹' : '🗑'}
                  </button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Security password modal */}
      {pendingAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#111', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: 24, width: 360 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Security Check</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
              Action: <strong>{pendingAction.action}</strong> on <code>{pendingAction.containerName}</code>
            </div>
            <input type="password" placeholder="Action password" value={actionPassword}
              onChange={e => setActionPassword(e.target.value)}
              style={{ width: '100%', background: '#0a0a0a', border: '0.5px solid #2a2a2a', borderRadius: 4, padding: '8px 12px', color: '#fff', fontSize: 13 }} />
            {actionError && <div style={{ color: '#E53935', fontSize: 12, marginTop: 6 }}>{actionError}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => { setPendingAction(null); setActionPassword(''); setActionError('') }}>Cancel</button>
              <button onClick={confirmAction} style={{ background: '#E53935', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}>
                Confirm {pendingAction.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Pros
- All information and actions are visible at once without any extra clicks to reveal them.
- Consistent with standard admin table UIs — low learning curve.

### Cons
- Table becomes wide with 5 columns; on smaller screens the Actions column can crowd out content.
- Modal interrupts flow and requires re-entering password per action with no visual container context visible behind the overlay.

---

## Design B — Side Panel

### Layout Approach

The container table has no action buttons inline. Instead, each row is clickable (highlighted on hover). Clicking a row slides in a ~320px panel from the right side of the screen. The panel shows full container details, a label chip list, and stacked action buttons. The security password prompt appears inline inside the panel, directly above the action buttons, only when an action button is tapped.

```
┌──────────────────────────────────────────┬────────────────────────────────┐
│ Container Monitor  [ALPHA]               │  yt-transcriber_app_1      ✕  │
├──────────────────────────────────────────│                                │
│ [×yt-transcriber] [+Add filter]  [↻]    │  Image                         │
├─────────────────────────────────────────┤│  youtube-transcriber:latest    │
│ APP  3 containers                        │                                │
├──────────────┬────────┬───────────────── │  Created                       │
│ Name         │ Status │ Uptime           │  2026-06-14 09:12              │
├──────────────┼────────┼──────────────────│                                │
│▶ yt-trans.. │running │ Up 3 hours       │  Ports                         │
│  yt-trans.. │exited  │ Exited 2h ago    │  3000 → 3000/tcp               │
│  yt-trans.. │running │ Up 1 day         │                                │
└──────────────┴────────┴──────────────────│  Labels                        │
                                           │  [com.docker.compose.project:  │
                                           │   yt-transcriber]              │
                                           │  [com.docker.compose.service:  │
                                           │   app]                         │
                                           │                                │
                                           │  ─────────────────────────     │
                                           │  Action password               │
                                           │  ┌──────────────────────────┐ │
                                           │  │ ••••••••                 │ │
                                           │  └──────────────────────────┘ │
                                           │  [Invalid password]  ← error  │
                                           │                                │
                                           │  [▶ Start  ]                  │
                                           │  [⏸ Pause  ]                  │
                                           │  [⏹ Stop   ]                  │
                                           │  [🗑 Delete ] ← red           │
                                           └────────────────────────────────┘
```

### Security Password Flow

When the side panel is open and the admin clicks an action button, the button's text changes to "Confirm [action]" and a password input appears inline above the action stack. The admin types the password and clicks the (now-highlighted) action button again to confirm. This "two-tap" model means destructive actions require intent (first tap) + credential (password + second tap). The password is sent to `POST /api/admin/containers/[id]/action`. On failure, an inline error appears under the password field. On success, the panel refreshes the container state.

### Label Filter

A tag-style multi-select bar at the top. Available label values (from `com.docker.compose.project`, `com.docker.compose.service`) are shown as removable chips. Clicking `+ Add filter` opens a small popover listing all unique label keys and values found across all containers. Selecting one adds a filter chip. Containers must match ALL active chips to be shown. This allows filtering to exactly `project=yt-transcriber` + `service=worker` simultaneously.

### JSX Sketch

```tsx
// Design B — Side Panel sketch

function ContainersPageB() {
  const [selectedContainer, setSelectedContainer] = useState<DockerContainer | null>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string,string>>({ 'com.docker.compose.project': 'yt-transcriber' })
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionPassword, setActionPassword] = useState('')
  const [actionError, setActionError] = useState('')

  const filteredContainers = containers.filter(c =>
    Object.entries(activeFilters).every(([k, v]) => c.Labels?.[k] === v)
  )

  async function handleActionClick(action: string) {
    if (pendingAction !== action) {
      // First tap — arm the action, show password input
      setPendingAction(action)
      setActionPassword('')
      setActionError('')
      return
    }
    // Second tap — confirm with password
    const res = await fetch(`/api/admin/containers/${selectedContainer!.Id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, password: actionPassword }),
    })
    if (!res.ok) { setActionError('Invalid password'); return }
    setPendingAction(null)
    setActionPassword('')
    fetchContainers()
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Tag filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          {Object.entries(activeFilters).map(([k, v]) => (
            <span key={k} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: 'rgba(229,57,53,0.1)', border: '0.5px solid rgba(229,57,53,0.3)', color: '#E53935', display: 'flex', alignItems: 'center', gap: 4 }}>
              {k.split('.').pop()}: {v}
              <button onClick={() => { const f = {...activeFilters}; delete f[k]; setActiveFilters(f) }} style={{ background: 'none', border: 'none', color: '#E53935', cursor: 'pointer', padding: 0 }}>×</button>
            </span>
          ))}
          <button style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: 'transparent', border: '0.5px solid #2a2a2a', color: '#555', cursor: 'pointer' }}>
            + Add filter
          </button>
        </div>

        {/* Container table — rows are clickable */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>Name</th><th>Status</th><th>Uptime</th></tr></thead>
          <tbody>
            {filteredContainers.map(c => (
              <tr key={c.Id} onClick={() => { setSelectedContainer(c); setPendingAction(null) }}
                style={{ cursor: 'pointer', background: selectedContainer?.Id === c.Id ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderBottom: '0.5px solid #141414' }}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontFamily: 'monospace' }}>{c.Names[0]}</td>
                <td style={{ padding: '10px 16px' }}>{statusBadge(c.State, c.Status)}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#888' }}>{c.Status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Side panel */}
      {selectedContainer && (
        <div style={{ width: 320, borderLeft: '0.5px solid #1e1e1e', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 20, gap: 16 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{selectedContainer.Names[0].replace(/^\//, '')}</span>
            <button onClick={() => setSelectedContainer(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Image', selectedContainer.Image], ['Created', new Date(selectedContainer.Created * 1000).toLocaleString()], ['Ports', formatPorts(selectedContainer.Ports)]].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, color: '#ccc', fontFamily: 'monospace' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Label chips */}
          <div>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Labels</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(selectedContainer.Labels ?? {}).map(([k, v]) => (
                <span key={k} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '0.5px solid #2a2a2a', color: '#888', fontFamily: 'monospace' }}>
                  {k}: {v}
                </span>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '0.5px solid #1e1e1e' }} />

          {/* Password input — shows when an action is armed */}
          {pendingAction && (
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Action password to confirm <strong>{pendingAction}</strong>:</div>
              <input type="password" value={actionPassword} onChange={e => setActionPassword(e.target.value)}
                placeholder="Action password"
                style={{ width: '100%', background: '#111', border: '0.5px solid #2a2a2a', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }} />
              {actionError && <div style={{ color: '#E53935', fontSize: 11, marginTop: 4 }}>{actionError}</div>}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { action: 'start', label: '▶ Start', danger: false },
              { action: 'pause', label: '⏸ Pause', danger: false },
              { action: 'stop',  label: '⏹ Stop',  danger: false },
              { action: 'delete',label: '🗑 Delete', danger: true },
            ].map(({ action, label, danger }) => (
              <button key={action} onClick={() => handleActionClick(action)}
                style={{ padding: '8px 12px', fontSize: 12, borderRadius: 5, cursor: 'pointer', textAlign: 'left',
                  background: pendingAction === action ? (danger ? '#E53935' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)',
                  border: `0.5px solid ${danger ? 'rgba(229,57,53,0.3)' : '#2a2a2a'}`,
                  color: danger ? (pendingAction === action ? '#fff' : '#E53935') : '#ccc',
                  fontWeight: pendingAction === action ? 600 : 400 }}>
                {pendingAction === action ? `Confirm ${action}` : label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Pros
- Rich context visible when performing any action — less chance of accidentally acting on the wrong container.
- Label chips in the panel double as exploration tool and can be clicked to add to the active filter set.

### Cons
- Requires two interactions (click row, then click action) before the security prompt appears — slightly slower for power users managing many containers.
- Side panel takes up ~320px of horizontal space, which reduces table width on narrow screens.
