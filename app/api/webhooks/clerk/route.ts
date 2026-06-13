import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { supabaseAdmin } from '@/lib/supabase'

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
    await supabaseAdmin.from('users').insert({
      clerk_user_id: event.data.id,
      email,
      tier: 'explorer',
      subscription_credits: 3,
      purchased_credits: 0,
    })
  }

  return NextResponse.json({ received: true })
}
