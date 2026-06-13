import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2A2A35] bg-[#0F0F13]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <img src="/logos/logo_full.png" alt="YT Transcriber" className="h-6 w-auto group-hover:opacity-80 transition-opacity" />
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8 flex-1 ml-12">
          <Link href="#features" className="text-sm text-[#888] hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-[#888] hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="text-sm text-[#888] hover:text-white transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={buttonVariants({ variant: 'default', size: 'sm' })}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
