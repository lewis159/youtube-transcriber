'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DeleteVideoButton({ videoId }: { videoId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/videos/${videoId}`, { method: 'DELETE' })
    router.push('/dashboard')
    router.refresh()
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
        Delete video
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</span>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
        {loading ? 'Deleting…' : 'Yes, delete'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
    </div>
  )
}
