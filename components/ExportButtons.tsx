'use client'

type Props = {
  videoId: string
  canExportPdf: boolean
}

export default function ExportButtons({ videoId, canExportPdf }: Props) {
  const dl = (format: string) => {
    window.location.href = `/api/export?videoId=${videoId}&format=${format}`
  }

  const btnBase = 'flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-md border transition-colors'
  const btnActive = `${btnBase} border-[#185FA5] text-[#85B7EB] hover:bg-[#042C53]/60`
  const btnLocked = `${btnBase} border-[#2A2A35] text-[#444] cursor-not-allowed`

  return (
    <div className="flex gap-2">
      <button className={btnActive} onClick={() => dl('txt')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        TXT
      </button>
      {canExportPdf ? (
        <button className={btnActive} onClick={() => dl('pdf')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          PDF
        </button>
      ) : (
        <button className={btnLocked} title="PDF export requires Creator tier or above" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          PDF
        </button>
      )}
      <button className={btnActive} onClick={() => dl('zip')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        ZIP
      </button>
    </div>
  )
}
