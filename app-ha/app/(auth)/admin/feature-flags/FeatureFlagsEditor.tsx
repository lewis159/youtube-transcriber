'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type TierKey = 'starter' | 'pro' | 'studio' | 'enterprise'

interface TierMeta {
  key: TierKey
  label: string
  color: string
  price: string
  includes: string | null
  prev: TierKey | null
}

const TIER_META: TierMeta[] = [
  { key: 'starter',    label: 'Starter',    color: '#888',    price: 'Free',   includes: null,                 prev: null },
  { key: 'pro',        label: 'Pro',        color: '#E53935', price: '$9/mo',  includes: 'Includes Starter +', prev: 'starter' },
  { key: 'studio',     label: 'Studio',     color: '#ff6b6b', price: '$29/mo', includes: 'Includes Pro +',     prev: 'pro' },
  { key: 'enterprise', label: 'Enterprise', color: '#ff8a80', price: 'Custom', includes: 'Includes Studio +',  prev: 'studio' },
]

function humanize(key: string) {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface Props {
  featureKeys: string[]
  // featureKey -> tier -> enabled
  initialMatrix: Record<string, Record<string, boolean>>
}

type SaveStatus = 'idle' | 'saving' | 'saved'

export default function FeatureFlagsEditor({ featureKeys, initialMatrix }: Props) {
  const router = useRouter()
  const [matrix, setMatrix] = useState(initialMatrix)
  const [pending, startTransition] = useTransition()
  // Staged (unsaved) changes: cellKey `${tier}:${feature}` -> staged enabled value.
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const cellKey = (feature: string, tier: TierKey) => `${tier}:${feature}`
  const savedOn = (feature: string, tier: TierKey) => !!matrix[feature]?.[tier]
  // Effective (displayed) value = staged value if dirty, else saved value.
  const isOn = (feature: string, tier: TierKey) => {
    const ck = cellKey(feature, tier)
    return ck in dirty ? dirty[ck] : savedOn(feature, tier)
  }
  const isDirty = (feature: string, tier: TierKey) => cellKey(feature, tier) in dirty
  const dirtyKeys = Object.keys(dirty)
  const hasChanges = dirtyKeys.length > 0

  // Stage a toggle in local state only — no network until Save.
  function toggle(feature: string, tier: TierKey) {
    const next = !isOn(feature, tier)
    const ck = cellKey(feature, tier)
    setSaveStatus('idle')
    setError(null)
    setDirty((d) => {
      const copy = { ...d }
      // If the staged value matches the saved value again, drop the dirty flag.
      if (next === savedOn(feature, tier)) {
        delete copy[ck]
      } else {
        copy[ck] = next
      }
      return copy
    })
  }

  function discard() {
    setDirty({})
    setError(null)
    setSaveStatus('idle')
  }

  async function save() {
    setSaveStatus('saving')
    setError(null)
    const entries = Object.entries(dirty)
    try {
      for (const [ck, enabled] of entries) {
        const idx = ck.indexOf(':')
        const tier = ck.slice(0, idx) as TierKey
        const feature = ck.slice(idx + 1)
        const res = await fetch('/api/admin/feature-flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, feature_key: feature, enabled }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Request failed (${res.status})`)
        }
        // Fold the saved change into the base matrix.
        setMatrix((m) => ({
          ...m,
          [feature]: { ...(m[feature] ?? {}), [tier]: enabled },
        }))
      }
      setDirty({})
      setSaveStatus('saved')
      // Refresh server data so the cached read reflects the writes.
      startTransition(() => router.refresh())
    } catch (e) {
      // Keep the dirty state so the admin can retry.
      setError(e instanceof Error ? e.message : 'Failed to save')
      setSaveStatus('idle')
    }
  }

  return (
    <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
      <div style={{ padding: '16px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>🏷️</span>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Tier Defaults</span>
        <span style={{ fontSize: '11px', color: '#555', marginLeft: '4px' }}>
          Click a feature to stage a change, then save
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {error && (
            <span style={{ fontSize: '11px', color: '#E53935' }}>{error}</span>
          )}
          {saveStatus === 'saved' && !hasChanges && (
            <span style={{ fontSize: '11px', color: '#22c55e' }}>✓ Saved</span>
          )}
          {hasChanges && (
            <>
              <span style={{ fontSize: '11px', color: '#f59e0b' }}>
                {dirtyKeys.length} unsaved change{dirtyKeys.length === 1 ? '' : 's'}
              </span>
              <button
                onClick={discard}
                disabled={saveStatus === 'saving'}
                style={{
                  fontSize: '11px', color: '#888',
                  background: 'transparent', border: '0.5px solid #333',
                  borderRadius: '5px', padding: '4px 12px',
                  cursor: saveStatus === 'saving' ? 'default' : 'pointer',
                }}
              >
                Discard
              </button>
              <button
                onClick={save}
                disabled={saveStatus === 'saving'}
                style={{
                  fontSize: '11px', fontWeight: 600, color: '#fff',
                  background: '#E53935', border: '0.5px solid #E53935',
                  borderRadius: '5px', padding: '4px 14px',
                  cursor: saveStatus === 'saving' ? 'default' : 'pointer',
                  opacity: saveStatus === 'saving' ? 0.7 : 1,
                }}
              >
                {saveStatus === 'saving' ? 'Saving…' : 'Save changes'}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '20px', gap: '12px', opacity: pending ? 0.85 : 1 }}>
        {TIER_META.map((meta) => {
          const inherited = meta.prev
            ? featureKeys.filter((f) => isOn(f, meta.prev as TierKey))
            : []
          const added = featureKeys.filter((f) => {
            if (!isOn(f, meta.key)) return false
            if (meta.prev === null) return true
            return !isOn(f, meta.prev)
          })
          // Features available to toggle ON in this card that the previous tier
          // does NOT already grant (so admins can enable new ones too).
          const toggleableOff = featureKeys.filter((f) => {
            if (isOn(f, meta.key)) return false
            if (meta.prev && isOn(f, meta.prev as TierKey)) return false
            return true
          })

          return (
            <div key={meta.key} style={{
              background: '#141414',
              border: `0.5px solid ${meta.color}33`,
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 16px',
                borderBottom: `0.5px solid ${meta.color}33`,
                background: `${meta.color}0d`,
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: meta.color }}>{meta.label}</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{meta.price}</div>
              </div>

              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* Inherited features (read-only summary — toggle them on their own tier card) */}
                {meta.includes && inherited.length > 0 && (
                  <>
                    <div style={{
                      fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.07em', color: '#444', marginBottom: '8px',
                      paddingBottom: '6px', borderBottom: '0.5px solid #1e1e1e',
                    }}>
                      {meta.includes}
                    </div>
                    {inherited.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                        <span style={{ fontSize: '13px', color: '#3a6b3a', lineHeight: 1 }}>✓</span>
                        <span style={{ fontSize: '12px', color: '#555' }}>{humanize(f)}</span>
                      </div>
                    ))}
                  </>
                )}

                {(added.length > 0 || toggleableOff.length > 0) && (
                  <div style={{
                    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.07em', color: meta.color, margin: meta.includes ? '10px 0 8px' : '0 0 8px',
                    paddingBottom: '6px', borderBottom: `0.5px solid ${meta.color}33`,
                  }}>
                    {meta.prev ? `New in ${meta.label}` : 'Features'}
                  </div>
                )}

                {/* Enabled (added) features — click to stage disable */}
                {added.map((f) => {
                  const cellDirty = isDirty(f, meta.key)
                  return (
                    <button
                      key={f}
                      onClick={() => toggle(f, meta.key)}
                      title="Click to disable for this tier"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
                        borderLeft: `2px solid ${meta.color}`, marginLeft: '-8px',
                        background: cellDirty ? 'rgba(245,158,11,0.1)' : 'transparent',
                        border: 'none', borderLeftWidth: '2px', borderLeftStyle: 'solid',
                        borderLeftColor: meta.color, cursor: 'pointer', textAlign: 'left', width: '100%',
                        borderRadius: cellDirty ? '4px' : 0,
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#22c55e', lineHeight: 1 }}>✓</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{humanize(f)}</span>
                      {cellDirty && <span style={{ fontSize: '12px', color: '#f59e0b', marginLeft: 'auto' }}>*</span>}
                    </button>
                  )
                })}

                {/* Disabled features available to enable — click to stage enable */}
                {toggleableOff.map((f) => {
                  const cellDirty = isDirty(f, meta.key)
                  return (
                    <button
                      key={f}
                      onClick={() => toggle(f, meta.key)}
                      title="Click to enable for this tier"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
                        marginLeft: '-8px',
                        background: cellDirty ? 'rgba(245,158,11,0.1)' : 'transparent',
                        border: 'none', borderRadius: cellDirty ? '4px' : 0,
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#E53935', lineHeight: 1 }}>✗</span>
                      <span style={{ fontSize: '12px', color: '#555' }}>{humanize(f)}</span>
                      {cellDirty && <span style={{ fontSize: '12px', color: '#f59e0b', marginLeft: 'auto' }}>*</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
