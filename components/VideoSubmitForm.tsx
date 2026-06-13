'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function VideoSubmitForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()

      if (res.status === 409) {
        // Already exists — navigate to it
        router.push(`/video/${data.id}`)
        return
      }
      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Something went wrong.')
        return
      }
      setUrl('')
      router.push(`/video/${data.id}`)
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !url}>
          {loading ? 'Transcribing…' : 'Transcribe'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
