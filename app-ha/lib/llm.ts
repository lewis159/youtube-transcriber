// ── Pluggable LLM provider layer ──────────────────────────────────────────────
// Lets AI summaries and Q&A chat run on the user's OWN local LLM (Ollama /
// Open WebUI) via their OpenAI-compatible chat-completions API, with Anthropic
// kept as an optional provider. Local is the DEFAULT and needs no Anthropic key.
//
// Env:
//   LLM_PROVIDER  'local' | 'anthropic'   (default 'local')
//   LLM_BASE_URL  OpenAI-compatible base, e.g. http://host:11434/v1 (Ollama)
//                 or the Open WebUI OpenAI URL. No trailing slash needed.
//   LLM_MODEL     e.g. 'llama3.2', 'qwen2.5'
//   LLM_API_KEY   optional bearer token (Open WebUI). Omit for bare Ollama.
//
// Pure + dependency-light: the local path uses fetch only (no SDK), so it works
// with any OpenAI-compatible server and deletes cleanly.

/** Which provider summaries/chat should use. Defaults to 'local'. */
export type LlmProvider = 'local' | 'anthropic'

/**
 * User-facing preference values (stored on users.ai_provider). These map to the
 * internal LlmProvider: 'local' → local, 'hosted' → anthropic (Claude).
 */
export type AiProviderPref = 'local' | 'hosted'

/** Map a user-facing preference to the internal provider. */
export function providerFromPref(pref: AiProviderPref): LlmProvider {
  return pref === 'hosted' ? 'anthropic' : 'local'
}

/**
 * Resolve the active provider. An explicit per-user `override` (the user-facing
 * preference) wins over the LLM_PROVIDER env default; when omitted we fall back
 * to the env (default 'local').
 */
export function getProvider(override?: AiProviderPref): LlmProvider {
  if (override) return providerFromPref(override)
  return (process.env.LLM_PROVIDER ?? 'local').toLowerCase() === 'anthropic'
    ? 'anthropic'
    : 'local'
}

/** Resolve the configured local base URL, trimming any trailing slash. */
function getBaseUrl(): string {
  const raw = process.env.LLM_BASE_URL
  if (!raw) {
    throw new Error(
      'LLM_BASE_URL is not set. Point it at your OpenAI-compatible endpoint ' +
        '(e.g. http://host:11434/v1 for Ollama, or your Open WebUI OpenAI URL).'
    )
  }
  return raw.replace(/\/+$/, '')
}

/** Resolve the configured local model name. */
function getModel(): string {
  const model = process.env.LLM_MODEL
  if (!model) {
    throw new Error(
      "LLM_MODEL is not set. Set it to your local model name (e.g. 'llama3.2', 'qwen2.5')."
    )
  }
  return model
}

/** Default request timeout (ms) for local calls — local boxes can be slow. */
const LOCAL_TIMEOUT_MS = 120_000

export interface LocalChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LocalChatOptions {
  /** System prompt (transcript / instructions). */
  system: string
  /** Conversation turns (user/assistant), in order. */
  messages: LocalChatMessage[]
  /** When true, ask for a JSON object response (belt-and-braces with prompt). */
  json?: boolean
  /** Max tokens to generate. */
  maxTokens?: number
  /** Optional caller abort signal (merged with the internal timeout). */
  signal?: AbortSignal
}

/** Build the headers for a local OpenAI-compatible request. */
function localHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const key = process.env.LLM_API_KEY
  if (key) headers['Authorization'] = `Bearer ${key}`
  return headers
}

/**
 * Compose an AbortSignal that fires on either the caller's signal or an internal
 * timeout. Returns the signal plus a clear function to cancel the timeout.
 */
function withTimeout(signal?: AbortSignal, ms = LOCAL_TIMEOUT_MS): {
  signal: AbortSignal
  clear: () => void
} {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new Error(`Local LLM request timed out after ${ms}ms`)),
    ms
  )
  const onAbort = () => controller.abort(signal?.reason)
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason)
    else signal.addEventListener('abort', onAbort, { once: true })
  }
  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer)
      if (signal) signal.removeEventListener('abort', onAbort)
    },
  }
}

/**
 * Non-streaming local chat completion against the OpenAI-compatible endpoint.
 * Returns the assistant message text. When `json` is true we request
 * `response_format: { type: 'json_object' }` — but callers should ALSO instruct
 * JSON in the prompt and parse defensively with extractJson(), because local
 * models vary in how strictly they honour response_format.
 */
export async function localChat(opts: LocalChatOptions): Promise<string> {
  const baseUrl = getBaseUrl()
  const model = getModel()
  const { signal, clear } = withTimeout(opts.signal)

  const body: Record<string, unknown> = {
    model,
    stream: false,
    max_tokens: opts.maxTokens ?? 4000,
    messages: [
      { role: 'system', content: opts.system },
      ...opts.messages,
    ],
  }
  if (opts.json) {
    body.response_format = { type: 'json_object' }
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: localHeaders(),
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    clear()
    throw new Error(
      `Local LLM request failed (${baseUrl}/chat/completions): ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    clear()
    throw new Error(
      `Local LLM returned ${response.status} ${response.statusText}${
        detail ? `: ${detail.slice(0, 500)}` : ''
      }`
    )
  }

  let data: {
    choices?: { message?: { content?: string } }[]
  }
  try {
    data = await response.json()
  } catch (err) {
    clear()
    throw new Error(
      `Local LLM returned a non-JSON response: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }
  clear()

  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.length === 0) {
    throw new Error('Local LLM returned an empty completion.')
  }
  return content
}

/**
 * Streaming local chat completion. Async generator yielding text deltas parsed
 * from the OpenAI-compatible SSE stream (`data: {...}` lines, terminated by
 * `data: [DONE]`). Use for the chat route.
 */
export async function* localChatStream(
  opts: LocalChatOptions
): AsyncGenerator<string, void, unknown> {
  const baseUrl = getBaseUrl()
  const model = getModel()
  const { signal, clear } = withTimeout(opts.signal)

  const body: Record<string, unknown> = {
    model,
    stream: true,
    max_tokens: opts.maxTokens ?? 1024,
    messages: [
      { role: 'system', content: opts.system },
      ...opts.messages,
    ],
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: localHeaders(),
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    clear()
    throw new Error(
      `Local LLM stream request failed (${baseUrl}/chat/completions): ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }

  if (!response.ok || !response.body) {
    const detail = response.ok ? '' : await response.text().catch(() => '')
    clear()
    throw new Error(
      `Local LLM stream returned ${response.status} ${response.statusText}${
        detail ? `: ${detail.slice(0, 500)}` : ''
      }`
    )
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE frames are separated by blank lines; process complete lines only.
      let newlineIndex: number
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)
        if (!line || !line.startsWith('data:')) continue

        const payload = line.slice('data:'.length).trim()
        if (payload === '[DONE]') {
          clear()
          return
        }

        try {
          const parsed = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[]
          }
          const delta = parsed.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta.length > 0) {
            yield delta
          }
        } catch {
          // Ignore malformed/partial frames; the next read may complete them.
        }
      }
    }
  } finally {
    clear()
    reader.releaseLock()
  }
}

/**
 * Robustly extract a JSON object from a model's text response. Handles models
 * that wrap JSON in prose or markdown code fences by:
 *   1. stripping ```json / ``` fences,
 *   2. slicing from the first `{` to the last `}`,
 *   3. JSON.parse.
 * Throws a clear error if no parseable object can be found.
 */
export function extractJson<T = unknown>(text: string): T {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Cannot extract JSON from an empty model response.')
  }

  // 1. Try a direct parse first (best case: clean JSON object).
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed) as T
  } catch {
    /* fall through to fence-stripping + brace-slicing */
  }

  // 2. Strip markdown code fences (```json ... ``` or ``` ... ```).
  let cleaned = trimmed.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '')

  // 3. Slice from the first `{` to the last `}` — drops surrounding prose.
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1)
  }

  try {
    return JSON.parse(cleaned) as T
  } catch (err) {
    throw new Error(
      `Could not parse JSON from the local model's response: ${
        err instanceof Error ? err.message : String(err)
      }. Raw output (truncated): ${text.slice(0, 300)}`
    )
  }
}
