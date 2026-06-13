'use client'

import { Button } from '@/components/ui/button'

type Props = {
  videoId: string
  canExportPdf: boolean
}

export default function ExportButtons({ videoId, canExportPdf }: Props) {
  const dl = (format: string) => {
    window.location.href = `/api/export?videoId=${videoId}&format=${format}`
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" variant="outline" onClick={() => dl('txt')}>Export TXT</Button>
      <Button size="sm" variant="outline" onClick={() => dl('zip')}>Export ZIP</Button>
      {canExportPdf ? (
        <Button size="sm" variant="outline" onClick={() => dl('pdf')}>Export PDF</Button>
      ) : (
        <Button size="sm" variant="outline" disabled title="PDF export requires Creator tier or above">
          Export PDF 🔒
        </Button>
      )}
    </div>
  )
}
