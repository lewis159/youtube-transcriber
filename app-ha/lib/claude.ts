// ── AI summarisation layer (pluggable provider) ──────────────────────────────
// Additive, flag-gated (`ai_summary`, default OFF). Routes through lib/llm.ts:
// by default summaries run on the user's OWN local LLM (Ollama / Open WebUI) via
// its OpenAI-compatible API and need NO Anthropic key. Set LLM_PROVIDER=anthropic
// to use Claude instead (then ANTHROPIC_API_KEY is required).
//
// The Anthropic SDK is only constructed on the Claude path, so the local default
// works without an Anthropic key. Used by app/api/videos/[id]/summary/route.ts.

import Anthropic from '@anthropic-ai/sdk'
import { getProvider, localChat, extractJson, type AiProviderPref } from '@/lib/llm'

/**
 * Per-tier model selection. Tier keys match the app's tier system
 * (feature-flags.ts TIER_ORDER + migration 010 tier_features seed):
 * 'starter' | 'pro' | 'studio' | 'enterprise', stored lowercase on users.tier.
 *
 * Model IDs are the exact Anthropic strings — do NOT append date suffixes.
 */
export const MODEL_BY_TIER: Record<string, string> = {
  starter: 'claude-haiku-4-5',
  pro: 'claude-sonnet-4-6',
  studio: 'claude-opus-4-8',
  enterprise: 'claude-opus-4-8',
}

/** Fallback model when a tier is unknown/unmapped — cheapest, safest default. */
const DEFAULT_MODEL = 'claude-haiku-4-5'

/**
 * Cost guardrail: cap the transcript text we send to Claude. ~120k characters
 * is comfortably within every model's context window once tokenised, and keeps
 * a single summary call cheap. If the transcript exceeds this, we truncate and
 * tell the model so it can note the summary covers only part of the video.
 */
export const MAX_TRANSCRIPT_CHARS = 120_000

export interface TranscriptSegment {
  text: string
  start: number
  duration: number
}

export interface StructuredSummary {
  summary: string
  keyPoints: string[]
  chapters: { title: string; timestamp: string }[]
}

export interface SummariseResult extends StructuredSummary {
  /** The Claude model that produced this summary (persisted to video_summaries.model). */
  model: string
  /** True if the transcript was truncated before summarising. */
  truncated: boolean
}

/** The json_schema the model is constrained to (structured output). */
const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'A concise 2-4 paragraph prose summary of the video transcript.',
    },
    keyPoints: {
      type: 'array',
      description: 'The main takeaways, as short standalone bullet points.',
      items: { type: 'string' },
    },
    chapters: {
      type: 'array',
      description:
        'Chapter markers covering the video in order. Each timestamp must reference a real point from the transcript timings.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short chapter title.' },
          timestamp: {
            type: 'string',
            description: 'Start time of the chapter as MM:SS (or HH:MM:SS for long videos).',
          },
        },
        required: ['title', 'timestamp'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'keyPoints', 'chapters'],
  additionalProperties: false,
} as const

/** Format seconds as MM:SS (or HH:MM:SS) so the model can cite timestamps. */
function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

/**
 * Build a single plain-text transcript from segments, prefixing each line with
 * its timestamp so the model can produce chapter markers that reference real
 * points in the video. Truncates at MAX_TRANSCRIPT_CHARS.
 */
export function buildPlainText(segments: TranscriptSegment[]): {
  text: string
  truncated: boolean
} {
  const lines = segments.map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text}`)
  let text = lines.join('\n')
  let truncated = false
  if (text.length > MAX_TRANSCRIPT_CHARS) {
    text = text.slice(0, MAX_TRANSCRIPT_CHARS)
    truncated = true
  }
  return { text, truncated }
}

/**
 * Summarise a transcript with Claude using a per-tier model and a structured
 * (json_schema) output. `plainText` should already include timestamps (use
 * buildPlainText). Returns the parsed summary plus the model used.
 *
 * The output is small, so a non-streaming messages.create with a modest
 * max_tokens is fine.
 */
export async function summariseTranscript(
  plainText: string,
  tier: string,
  providerOverride?: AiProviderPref
): Promise<SummariseResult> {
  const model = MODEL_BY_TIER[tier] ?? DEFAULT_MODEL

  // Guard very long transcripts: cap the characters we send and note it.
  let input = plainText
  let truncated = false
  if (input.length > MAX_TRANSCRIPT_CHARS) {
    input = input.slice(0, MAX_TRANSCRIPT_CHARS)
    truncated = true
  }

  const truncationNote = truncated
    ? '\n\nNOTE: This transcript was truncated to fit length limits. Summarise the portion provided and keep chapter timestamps within it.'
    : ''

  const baseSystem =
    'You summarise YouTube video transcripts. Produce a clear prose summary, ' +
    'the key takeaways, and chapter markers whose timestamps reference the ' +
    '[MM:SS] markers in the transcript.'

  const userContent = `Summarise the following video transcript. Each line is prefixed with its timestamp.${truncationNote}\n\n${input}`

  // ── Local provider (default): OpenAI-compatible JSON-mode call ──────────────
  // Local models vary in how strictly they honour response_format, so we ask for
  // JSON mode AND describe the exact shape in the prompt, then parse defensively.
  if (getProvider(providerOverride) === 'local') {
    const localModel = process.env.LLM_MODEL ?? 'local'
    const jsonSystem =
      baseSystem +
      '\n\nRespond with a SINGLE JSON object and nothing else (no prose, no ' +
      'markdown fences) with exactly this shape:\n' +
      '{\n' +
      '  "summary": string,            // 2-4 paragraph prose summary\n' +
      '  "keyPoints": string[],        // main takeaways as short bullets\n' +
      '  "chapters": [ { "title": string, "timestamp": string } ]  // timestamp as MM:SS (or HH:MM:SS), referencing the transcript markers\n' +
      '}'

    const raw = await localChat({
      system: jsonSystem,
      messages: [{ role: 'user', content: userContent }],
      json: true,
      maxTokens: 4000,
    })

    const parsed = extractJson<StructuredSummary>(raw)

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
      model: localModel,
      truncated,
    }
  }

  // ── Anthropic provider: structured json_schema output ───────────────────────
  const client = new Anthropic() // reads ANTHROPIC_API_KEY from env

  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    output_config: {
      format: {
        type: 'json_schema',
        schema: SUMMARY_SCHEMA,
      },
    },
    system: baseSystem + ' Respond only via the structured schema.',
    messages: [
      {
        role: 'user',
        content: userContent,
      },
    ],
  })

  // With output_config.format the first text block is guaranteed valid JSON.
  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content for summary')
  }

  const parsed = JSON.parse(textBlock.text) as StructuredSummary

  return {
    summary: parsed.summary ?? '',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
    model,
    truncated,
  }
}
