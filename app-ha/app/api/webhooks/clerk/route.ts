import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let evt: any
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch (err) {
    return new Response('Invalid signature', { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data
    const primaryEmail = email_addresses[0]?.email_address

    if (!primaryEmail) {
      return new Response('No primary email', { status: 400 })
    }

    const { error } = await supabase.from('users').upsert(
      {
        clerk_user_id: id,
        email: primaryEmail,
        full_name: `${first_name || ''} ${last_name || ''}`.trim(),
        tier: 'starter',
      },
      { onConflict: 'clerk_user_id' }
    )

    if (error) {
      return new Response(`Supabase error: ${error.message}`, { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('clerk_user_id', id)

    if (error) {
      return new Response(`Supabase error: ${error.message}`, { status: 500 })
    }
  }

  return new Response('Webhook processed', { status: 200 })
}
