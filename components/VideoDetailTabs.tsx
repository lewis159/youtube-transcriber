'use client'

import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import NoteEditor from './NoteEditor'
import { formatTimestamp, type TranscriptSegment } from '@/lib/transcript'

type Props = {
  videoId: string
  youtubeId: string
  segments: TranscriptSegment[] | null
  initialNote: string
  status: string
  errorMessage?: string | null
}

export default function VideoDetailTabs({ videoId, youtubeId, segments, initialNote, status, errorMessage }: Props) {
  const [tab, setTab] = useState<'transcript' | 'notes'>('transcript')

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex border-b border-[#2A2A35]">
        {(['transcript', 'notes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-[#378ADD] text-[#85B7EB]'
                : 'border-transparent text-[#555] hover:text-[#888]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'transcript' && (
        <>
          {status === 'error' && (
            <p className="p-4 text-sm text-destructive">{errorMessage ?? 'Transcript failed to load.'}</p>
          )}
          {status === 'processing' && (
            <p className="p-4 text-sm text-[#555]">Processing&hellip;</p>
          )}
          {segments ? (
            <ScrollArea className="flex-1 h-[520px]">
              <div className="flex flex-col gap-3 p-4 text-sm">
                {segments.map((seg, i) => (
                  <div key={i} className="flex gap-3">
                    <a
                      href={`https://youtube.com/watch?v=${youtubeId}&t=${Math.floor(seg.start)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-[#378ADD] w-12 flex-shrink-0 hover:text-[#85B7EB] pt-0.5"
                    >
                      {formatTimestamp(seg.start)}
                    </a>
                    <p className="leading-relaxed text-[#B0B0BB]">{seg.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            status === 'done' && (
              <div className="flex-1 flex items-center justify-center text-[#555] text-sm py-12">
                No transcript available.
              </div>
            )
          )}
        </>
      )}

      {tab === 'notes' && (
        <div className="p-4 flex-1">
          <NoteEditor videoId={videoId} initialBody={initialNote} />
        </div>
      )}
    </div>
  )
}
