import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDbUser } from '@/lib/auth'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let user = null
  try {
    user = await getDbUser(userId)
  } catch {
    // User not yet synced from Clerk webhook — show placeholder
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-lg border p-6 flex flex-col gap-4">
        <h2 className="font-semibold">Account</h2>
        <div className="text-sm text-muted-foreground">
          <p>Tier: <span className="font-medium text-foreground capitalize">{user?.tier ?? 'Explorer'}</span></p>
          <p>Credits remaining: <span className="font-medium text-foreground">{user ? user.subscription_credits + user.purchased_credits : '—'}</span></p>
        </div>
      </div>

      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Billing and subscription management coming in Phase 2 (Stripe integration).
      </div>
    </div>
  )
}
