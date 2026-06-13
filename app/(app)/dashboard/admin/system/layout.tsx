import Link from 'next/link'

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      {/* Navigation Back */}
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#378ADD] hover:text-[#85B7EB] flex items-center gap-1">
          ← Back to Admin Dashboard
        </Link>
      </div>
      {children}
    </div>
  )
}
