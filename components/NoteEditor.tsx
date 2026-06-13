'use client'

import { useState, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

type Props = {
  videoId: string
  initialBody: string
}

export default function NoteEditor({ videoId, initialBody }: Props) {
  const [body, setBody] = useState(initialBody)
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)

  const save = useCallback(async () => {
    setSaving(true)
    await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, body }),
    })
    setSaving(false)
    setSaved(true)
  }, [videoId, body])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Notes</h2>
        <div className="flex items-center gap-2">
          {!saved && <span className="text-xs text-muted-foreground">Unsaved</span>}
          <Button size="sm" variant="outline" onClick={save} disabled={saving || saved}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      <Textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); setSaved(false) }}
        placeholder="Add notes here…"
        className="min-h-[160px] resize-y"
      />
    </div>
  )
}
