'use client'

import { useState } from 'react'

export default function ExportPdfButton({ articleTitle }: { articleTitle: string }) {
  const [exporting, setExporting] = useState(false)

  function handleExport() {
    setExporting(true)
    // Small delay so the "Exporting..." state renders before the print dialog opens
    setTimeout(() => {
      window.print()
      setExporting(false)
    }, 100)
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      aria-label={`Export "${articleTitle}" to PDF`}
      data-print-hide
      style={{
        background: 'transparent',
        border: '0.5px solid #2a2a2a',
        color: 'var(--text-secondary)',
        fontSize: '13px',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: exporting ? 'default' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'border-color 0.2s ease, color 0.2s ease',
        opacity: exporting ? 0.6 : 1,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!exporting) {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
        }
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
      }}
    >
      {exporting ? 'Exporting…' : '⬇ Export PDF'}
    </button>
  )
}
