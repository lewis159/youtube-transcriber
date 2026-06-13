import { MarketingHeader } from '@/components/MarketingHeader'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F13]">
      <MarketingHeader />
      {children}
    </div>
  )
}
