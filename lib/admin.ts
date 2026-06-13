import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from './supabase'

export async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: user } = await getSupabaseAdmin()
    .from('users')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (user?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

export async function listAllUsers(limit = 50, offset = 0) {
  const { data, count, error } = await getSupabaseAdmin()
    .from('users')
    .select(
      `
      id,
      email,
      tier,
      role,
      subscription_credits,
      purchased_credits,
      created_at,
      stripe_customer_id
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { users: data || [], total: count || 0 }
}

export async function getUserDetails(userId: string) {
  const { data: user, error } = await getSupabaseAdmin()
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error

  // Get credit history
  const { data: transactions } = await getSupabaseAdmin()
    .from('credit_transactions')
    .select(
      `
      id,
      amount,
      reason,
      notes,
      created_at,
      admin_id
      `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return { user, transactions }
}

export async function addCredits(
  userId: string,
  amount: number,
  reason: string,
  notes?: string
) {
  const { userId: adminId } = await auth()
  if (!adminId) throw new Error('Not authenticated')

  // Get admin's Supabase user ID
  const { data: adminUser } = await getSupabaseAdmin()
    .from('users')
    .select('id')
    .eq('clerk_user_id', adminId)
    .single()

  // Update user credits
  const { data: user, error: updateError } = await getSupabaseAdmin()
    .from('users')
    .select('subscription_credits, purchased_credits')
    .eq('id', userId)
    .single()

  if (updateError) throw updateError

  // Determine which credit pool to update
  const isAddingSubscriptionCredits = reason.includes('subscription')
  const newSubscription = isAddingSubscriptionCredits
    ? user.subscription_credits + amount
    : user.subscription_credits
  const newPurchased = !isAddingSubscriptionCredits
    ? user.purchased_credits + amount
    : user.purchased_credits

  await getSupabaseAdmin()
    .from('users')
    .update({
      subscription_credits: newSubscription,
      purchased_credits: newPurchased,
    })
    .eq('id', userId)

  // Log transaction
  const { error: txError } = await getSupabaseAdmin()
    .from('credit_transactions')
    .insert({
      user_id: userId,
      admin_id: adminUser?.id,
      amount,
      reason,
      notes,
    })

  if (txError) throw txError

  return { subscription_credits: newSubscription, purchased_credits: newPurchased }
}
