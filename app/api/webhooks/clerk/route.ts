import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { getSupabaseAdmin } from '@/lib/supabase'

type ClerkUserEvent = {
  type: string
  data: { id: string; email_addresses: Array<{ email_address: string }> }
}

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret || !svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing headers' }, { status: 400 })
  }

  const payload = await req.text()
  const wh = new Webhook(webhookSecret)

  let event: ClerkUserEvent
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'user.created') {
    const email = event.data.email_addresses[0]?.email_address ?? ''

    // Create organization for user (one org per user)
    const emailPrefix = email.split('@')[0]
    const { data: org, error: orgError } = await getSupabaseAdmin()
      .from('organizations')
      .insert({ name: `${email}'s Workspace`, slug: `${emailPrefix}-${event.data.id.slice(0, 8)}` })
      .select()
      .single()

    if (orgError) throw orgError

    // Create user linked to organization
    await getSupabaseAdmin().from('users').insert({
      clerk_user_id: event.data.id,
      email,
      tier: 'explorer',
      role: 'user',
      organization_id: org.id,
      subscription_credits: 3,
      purchased_credits: 0,
    })
  } else if (event.type === 'user.updated') {
    const email = event.data.email_addresses[0]?.email_address ?? ''
    await getSupabaseAdmin()
      .from('users')
      .update({ email })
      .eq('clerk_user_id', event.data.id)
  } else if (event.type === 'user.deleted') {
    await getSupabaseAdmin()
      .from('users')
      .delete()
      .eq('clerk_user_id', event.data.id)
  }

  return NextResponse.json({ received: true })
}

