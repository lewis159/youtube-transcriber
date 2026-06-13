import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Paste a YouTube URL to get started.</p>
      </div>

      {/* URL input placeholder — wired up in next phase */}
      <div className="rounded-lg border p-6 flex flex-col gap-4">
        <p className="font-medium">Transcribe a video</p>
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            disabled
          />
          <button
            disabled
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
          >
            Transcribe
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Full functionality coming in Phase 1.</p>
      </div>

      {/* Empty state */}
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        No videos yet — transcribe your first one above.
      </div>
    </div>
  )
}
