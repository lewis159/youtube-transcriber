// ── YouTube embed seek helper — additive, Phase 4 (summary view) ─────────────
// Posts a `seekTo` command to an embedded YouTube iframe via the IFrame Player
// API postMessage protocol, so clicking a chapter / timestamp jumps the player
// in place instead of opening youtube.com in a new tab.
//
// Used by the summary page (chapters + Q&A). The existing TranscriptViewer
// drives the player through the full YT.Player object; this is the lighter
// postMessage path the Phase 4 brief asked for and works against any iframe
// embedded with `enablejsapi=1`.
//
// Deletes cleanly: pure module, no dependencies.

/** Parse an "MM:SS" or "HH:MM:SS" timestamp into whole seconds. */
export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp
    .trim()
    .split(':')
    .map((p) => parseInt(p, 10))
  if (parts.some((n) => Number.isNaN(n))) return 0
  let seconds = 0
  for (const p of parts) seconds = seconds * 60 + p
  return seconds
}

/**
 * Seek an embedded YouTube iframe to `seconds` and start playback.
 * Pass the iframe element (must have been embedded with `enablejsapi=1`).
 * No-ops safely if the iframe / contentWindow isn't available yet.
 */
export function seekYouTube(iframe: HTMLIFrameElement | null, seconds: number): void {
  const win = iframe?.contentWindow
  if (!win) return
  const target = Math.max(0, Math.floor(seconds))
  // seekTo(seconds, allowSeekAhead) then play, per the IFrame Player API.
  win.postMessage(
    JSON.stringify({ event: 'command', func: 'seekTo', args: [target, true] }),
    '*'
  )
  win.postMessage(
    JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
    '*'
  )
}
