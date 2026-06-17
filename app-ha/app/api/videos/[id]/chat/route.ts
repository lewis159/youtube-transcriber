export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  getVideoByIdAndUser,
  getVideoTranscript,
  getSupabaseUserId,
  supabaseAdmin,
} from '@/lib/supabase'
import { checkUserFeature, upgradeRequired } from '@/lib/feature-flags'
import {
  buildPlainText,
  MODEL_BY_TIER,
  type TranscriptSegment,
} from '@/lib/claude'
import { getProvider, localChatStream, type AiProviderPref } from '@/lib/llm'
import { checkRateLimit } from '@/lib/rate-limit'
import { logEvent, EVENTS } from '@/lib/event-log'

// ── Abuse/cost guardrail (HA-safe, Redis-backed) ─────────────────────────────
// Per-user chat throttle. Shared across replicas via Redis so it holds behind
// the load balancer. Tunable. Generous enough for normal use; backstops runaway
// scripts / cost abuse.
const CHAT_RATE_LIMIT = 30 // messages
const CHAT_RATE_WINDOW_SECONDS = 60 * 60 // per hour, per user

// ── Q&A chat over a transcript — additive, flag-gated on `summary_chat` ───────
// (default OFF, returns the same 403 `upgrade_required` shape as the export and
// summary routes).
//
//  POST { question: string, history?: {role:'user'|'assistant', content:string}[] }
//    → streams Claude's answer back as text/plain (chunked).
//
// Stateless: the client sends the question (and optionally a short prior-message
// array) each call; the transcript is loaded server-side and capped at
// MAX_TRANSCRIPT_CHARS. Model is chosen per the user's tier via MODEL_BY_TIER.

const DEFAULT_MODEL = 'claude-haiku-4-5'

/** Resolve the user's tier from users.tier (same source as checkUserFeature). */
async function getUserTier(clerkUserId: string): Promise<string> {
  try {
    const supabaseUserId = await getSupabaseUserId(clerkUserId)
    const { data } = await supabaseAdmin
      .from('users')
      .select('tier')
      .eq('id', supabaseUserId)
      .single()
    return data?.tier ?? 'starter'
  } catch {
    return 'starter'
  }
}

/** Resolve the user's AI provider preference (users.ai_provider). Default 'local'. */
async function getAiProvider(clerkUserId: string): Promise<AiProviderPref> {
  try {
    const supabaseUserId = await getSupabaseUserId(clerkUserId)
    const { data } = await supabaseAdmin
      .from('users')
      .select('ai_provider')
      .eq('id', supabaseUserId)
      .single()
    return data?.ai_provider === 'hosted' ? 'hosted' : 'local'
  } catch {
    return 'local'
  }
}

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Captured for the catch-block error log (declared inside try otherwise).
  let videoId: string | undefined
  let logUserId: string | undefined

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    logUserId = userId

    // Gate on summary_chat (default OFF) — same shape as export/summary routes.
    if (!(await checkUserFeature(userId, 'summary_chat'))) {
      return NextResponse.json(upgradeRequired('summary_chat'), { status: 403 })
    }

    const { id } = await params
    videoId = id

    // Verify ownership — throws if video not found or belongs to another user.
    try {
      await getVideoByIdAndUser(id, userId)
    } catch {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Parse body.
    let body: { question?: string; history?: ChatTurn[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const question = (body.question ?? '').trim()
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Per-user chat rate limit (HA-safe, fails open). Enforced before we do any
    // model work so abuse can't run up cost. Keyed by Clerk user id.
    const rate = await checkRateLimit(
      `chat:${userId}`,
      CHAT_RATE_LIMIT,
      CHAT_RATE_WINDOW_SECONDS
    )
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', scope: 'chat', resetSeconds: rate.resetSeconds },
        { status: 429 }
      )
    }

    // Keep history short + well-typed (stateless: bounded prior turns).
    const history: ChatTurn[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (t): t is ChatTurn =>
              !!t &&
              (t.role === 'user' || t.role === 'assistant') &&
              typeof t.content === 'string'
          )
          .slice(-8)
      : []

    // Load + cap the transcript.
    let transcript: { content: unknown } | null = null
    try {
      transcript = await getVideoTranscript(id)
    } catch {
      transcript = null
    }
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
    }

    const segments = (transcript.content as TranscriptSegment[]) ?? []
    if (segments.length === 0) {
      return NextResponse.json({ error: 'Transcript is empty' }, { status: 400 })
    }

    const { text: plainText } = buildPlainText(segments) // already caps at MAX_TRANSCRIPT_CHARS

    const tier = await getUserTier(userId)
    const model = MODEL_BY_TIER[tier] ?? DEFAULT_MODEL

    const aiProvider = await getAiProvider(userId)
    const provider = getProvider(aiProvider)

    // Lifecycle log: a chat question is being answered. Logged before streaming
    // begins so even an immediate stream failure still has its question recorded.
    await logEvent({
      event: EVENTS.chat_message,
      videoId: id,
      userId,
      metadata: {
        provider,
        tier,
        model: provider === 'local' ? null : model,
        questionLength: question.length,
        historyTurns: history.length,
      },
    })

    const systemPrompt =
      'You answer questions about a specific YouTube video using ONLY its ' +
      'transcript below. Each line is prefixed with its [MM:SS] timestamp. ' +
      'Be concise and accurate. If the answer is not in the transcript, say ' +
      'so plainly. When useful, cite the relevant [MM:SS] timestamp.\n\n' +
      `TRANSCRIPT:\n${plainText}`

    const turns = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: 'user' as const, content: question },
    ]

    // Stream the answer back to the client as plain text chunks.
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (provider === 'local') {
            // Local provider: pipe OpenAI-compatible SSE deltas straight through.
            for await (const delta of localChatStream({
              system: systemPrompt,
              messages: turns,
              maxTokens: 1024,
            })) {
              controller.enqueue(encoder.encode(delta))
            }
          } else {
            // Anthropic provider: existing Claude streaming path.
            const client = new Anthropic() // reads ANTHROPIC_API_KEY from env
            const claudeStream = client.messages.stream({
              model,
              max_tokens: 1024,
              system: systemPrompt,
              messages: turns,
            })

            claudeStream.on('text', (delta: string) => {
              controller.enqueue(encoder.encode(delta))
            })

            await claudeStream.finalMessage()
          }
          controller.close()
        } catch (err) {
          console.error('Chat stream error:', err)
          // Lifecycle log: generation failed mid-stream. (logEvent never throws.)
          await logEvent({
            level: 'error',
            event: EVENTS.error,
            videoId: id,
            userId,
            message: err instanceof Error ? err.message : 'Chat generation failed',
            metadata: { stage: 'chat', provider },
          })
          // Surface a short error to the client stream, then close.
          try {
            controller.enqueue(
              encoder.encode('\n\n[Error: failed to generate a response.]')
            )
          } catch {
            /* ignore */
          }
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)

    // Lifecycle log: chat request failed before streaming. (logEvent never throws.)
    await logEvent({
      level: 'error',
      event: EVENTS.error,
      videoId,
      userId: logUserId,
      message: error instanceof Error ? error.message : 'Chat failed',
      metadata: { stage: 'chat' },
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    )
  }
}
