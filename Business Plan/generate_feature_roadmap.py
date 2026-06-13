from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import date

OUTPUT    = r"Z:\GIT\Cursor\new project\youtube-transcriber\Business Plan\YT_Transcriber_Feature_Roadmap.pdf"
LOGO_PATH = r"Z:\GIT\Cursor\new project\youtube-transcriber\Business Plan\logo_full@2x.png"

# ── Colours ───────────────────────────────────────────────────────────────────
RED      = colors.HexColor("#E53935")
DARK_BG  = colors.HexColor("#1A1A1A")
LIGHT_BG = colors.HexColor("#F5F5F5")
MID_GREY = colors.HexColor("#CCCCCC")
DK_GREY  = colors.HexColor("#555555")
WHITE    = colors.white
GREEN    = colors.HexColor("#4CAF50")
AMBER    = colors.HexColor("#F59E0B")
BLUE     = colors.HexColor("#3B82F6")
PURPLE   = colors.HexColor("#7C3AED")
GREY_MID = colors.HexColor("#888888")
RED_SOFT = colors.HexColor("#FFEBEE")
GRN_SOFT = colors.HexColor("#F1F8E9")

# ── Styles ────────────────────────────────────────────────────────────────────
def S(name, **kw):
    return ParagraphStyle(name, **kw)

h1       = S("H1",    fontSize=18, textColor=DARK_BG,  spaceBefore=14, spaceAfter=6,  fontName="Helvetica-Bold")
h2       = S("H2",    fontSize=13, textColor=RED,      spaceBefore=10, spaceAfter=4,  fontName="Helvetica-Bold")
h3       = S("H3",    fontSize=10, textColor=DARK_BG,  spaceBefore=7,  spaceAfter=3,  fontName="Helvetica-Bold")
body     = S("Body",  fontSize=9.5, textColor=DARK_BG, spaceAfter=5,   fontName="Helvetica",      leading=14)
body_sm  = S("BSm",   fontSize=8.5, textColor=DK_GREY, spaceAfter=3,   fontName="Helvetica",      leading=12)
bullet   = S("Bul",   fontSize=9.5, textColor=DARK_BG, spaceAfter=3,   fontName="Helvetica",      leading=14, leftIndent=14)
note     = S("Note",  fontSize=8,   textColor=DK_GREY, spaceAfter=4,   fontName="Helvetica-Oblique")
tbl_head = S("TH",    fontSize=9,   textColor=WHITE,   fontName="Helvetica-Bold", alignment=TA_CENTER)
tbl_cell = S("TC",    fontSize=8.5, textColor=DARK_BG, fontName="Helvetica",      alignment=TA_CENTER, leading=11)
tbl_lbl  = S("TL",    fontSize=8.5, textColor=DARK_BG, fontName="Helvetica-Bold", alignment=TA_LEFT,   leading=11)
tbl_sm   = S("TS",    fontSize=8,   textColor=DK_GREY, fontName="Helvetica",      alignment=TA_LEFT,   leading=11)

BASE_STYLE = [
    ("BACKGROUND",    (0, 0), (-1, 0), DARK_BG),
    ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ("GRID",          (0, 0), (-1, -1), 0.4, MID_GREY),
    ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING",    (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING",   (0, 0), (-1, -1), 6),
    ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
]

def hdr(t):  return Paragraph(t, tbl_head)
def cell(t): return Paragraph(t, tbl_cell)
def lbl(t):  return Paragraph(t, tbl_lbl)
def sm(t):   return Paragraph(t, tbl_sm)
def rule():  return HRFlowable(width="100%", thickness=1, color=MID_GREY, spaceAfter=4, spaceBefore=4)

# Phase badge styles
ph_live = S("PhL", fontSize=8.5, textColor=GREEN,    fontName="Helvetica-Bold", alignment=TA_CENTER)
ph_1    = S("Ph1", fontSize=8.5, textColor=RED,      fontName="Helvetica-Bold", alignment=TA_CENTER)
ph_2    = S("Ph2", fontSize=8.5, textColor=AMBER,    fontName="Helvetica-Bold", alignment=TA_CENTER)
ph_3    = S("Ph3", fontSize=8.5, textColor=BLUE,     fontName="Helvetica-Bold", alignment=TA_CENTER)
ph_fut  = S("PhF", fontSize=8.5, textColor=GREY_MID, fontName="Helvetica-Bold", alignment=TA_CENTER)
ph_pri  = S("PrH", fontSize=8.5, textColor=GREEN,    fontName="Helvetica-Bold", alignment=TA_CENTER)
ph_prm  = S("PrM", fontSize=8.5, textColor=AMBER,    fontName="Helvetica-Bold", alignment=TA_CENTER)
ph_prf  = S("PrF", fontSize=8.5, textColor=GREY_MID, fontName="Helvetica-Bold", alignment=TA_CENTER)

def phase(p):
    if p == "Live":    return Paragraph("&#10003; Live",   ph_live)
    if p == "Phase 1": return Paragraph("Phase 1",         ph_1)
    if p == "Phase 2": return Paragraph("Phase 2",         ph_2)
    if p == "Phase 3": return Paragraph("Phase 3",         ph_3)
    return Paragraph("Future", ph_fut)

def priority(p):
    if p == "Critical": return Paragraph("Critical", ph_1)
    if p == "High":     return Paragraph("High",     ph_pri)
    if p == "Medium":   return Paragraph("Medium",   ph_prm)
    return Paragraph("Low", ph_prf)

def effort(e):
    if e == "Low":       return Paragraph("Low",       ph_pri)
    if e == "Medium":    return Paragraph("Medium",    ph_prm)
    if e == "High":      return Paragraph("High",      ph_1)
    return Paragraph("Very High", S("pvh", fontSize=8.5, textColor=PURPLE, fontName="Helvetica-Bold", alignment=TA_CENTER))

# ── TOC support ───────────────────────────────────────────────────────────────
class TOCDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            if flowable.style.name == 'H1':
                self.notify('TOCEntry', (0, flowable.getPlainText(), self.page))

toc_entry_style = ParagraphStyle(
    'TOCEntry', fontName='Helvetica', fontSize=10, textColor=DARK_BG,
    spaceBefore=5, spaceAfter=1, leftIndent=0, leading=14
)

def build_toc():
    toc = TableOfContents()
    toc.levelStyles = [toc_entry_style]
    toc.dotsMinLevel = 0
    return toc

# ── Document ──────────────────────────────────────────────────────────────────
doc = TOCDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm,
    topMargin=15*mm,  bottomMargin=15*mm,
    title="YT Transcriber — Feature Roadmap",
    author="YT Transcriber"
)
W = A4[0] - 36*mm
story = []

# ── Cover ─────────────────────────────────────────────────────────────────────
logo_w   = W * 0.58
logo_img = Image(LOGO_PATH, width=logo_w, height=logo_w / 5)

cover = Table([[
    logo_img,
    Paragraph("CONFIDENTIAL", S("CF", fontSize=8, textColor=MID_GREY, fontName="Helvetica", alignment=TA_RIGHT))
]], colWidths=[W*0.75, W*0.25])
cover.setStyle(TableStyle([
    ("BACKGROUND",    (0,0),(-1,-1), DARK_BG),
    ("TOPPADDING",    (0,0),(-1,-1), 14),
    ("BOTTOMPADDING", (0,0),(-1,-1), 14),
    ("LEFTPADDING",   (0,0),(-1,-1), 14),
    ("RIGHTPADDING",  (0,0),(-1,-1), 14),
    ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
]))
story.append(cover)

cover2 = Table([[
    Paragraph("Feature Roadmap &amp; Future Development", S("CS", fontSize=18, textColor=WHITE, fontName="Helvetica-Bold")),
    Paragraph(f"Prepared: {date.today().strftime('%d %B %Y')}", S("CD", fontSize=9, textColor=MID_GREY, fontName="Helvetica", alignment=TA_RIGHT))
]], colWidths=[W*0.72, W*0.28])
cover2.setStyle(TableStyle([
    ("BACKGROUND",    (0,0),(-1,-1), DARK_BG),
    ("TOPPADDING",    (0,0),(-1,-1), 4),
    ("BOTTOMPADDING", (0,0),(-1,-1), 20),
    ("LEFTPADDING",   (0,0),(-1,-1), 14),
    ("RIGHTPADDING",  (0,0),(-1,-1), 14),
    ("VALIGN",        (0,0),(-1,-1), "BOTTOM"),
]))
story.append(cover2)
story.append(Spacer(1, 10))

# ── Table of Contents ─────────────────────────────────────────────────────────
story.append(Paragraph("Contents", h1))
story.append(rule())
story.append(build_toc())
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  1. OVERVIEW
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("1. Overview", h1))
story.append(rule())
story.append(Paragraph(
    "This document provides a complete picture of the YT Transcriber product across three dimensions: "
    "what is currently <b>live</b> in the MVP, what has been <b>planned</b> as the next phases of development, "
    "and recommended <b>future features</b> that would strengthen the product, improve retention, and open "
    "new revenue opportunities.",
    body))
story.append(Paragraph("Features are grouped into four release tiers:", body))

phase_key = [
    ["&#10003; Live",  "Already built and working in the current MVP."],
    ["Phase 1",        "Next immediate build — Clerk auth, billing, and subscription tiers."],
    ["Phase 2",        "Collections, sharing, and team collaboration features."],
    ["Phase 3",        "AI-powered features, automation, and advanced transcript tools."],
    ["Future",         "Longer-term ideas for v2+ — high value but not immediately required."],
]
pk_styles = [ph_live, ph_1, ph_2, ph_3, ph_fut]
pk_data = [[Paragraph(r[0], pk_styles[i]), sm(r[1])] for i, r in enumerate(phase_key)]
pk_t = Table(pk_data, colWidths=[W*0.20, W*0.80])
pk_t.setStyle(TableStyle([
    ("ROWBACKGROUNDS", (0,0),(-1,-1), [WHITE, LIGHT_BG]),
    ("GRID",           (0,0),(-1,-1), 0.4, MID_GREY),
    ("VALIGN",         (0,0),(-1,-1), "MIDDLE"),
    ("TOPPADDING",     (0,0),(-1,-1), 5),
    ("BOTTOMPADDING",  (0,0),(-1,-1), 5),
    ("LEFTPADDING",    (0,0),(-1,-1), 8),
    ("RIGHTPADDING",   (0,0),(-1,-1), 8),
]))
story.append(pk_t)

# ══════════════════════════════════════════════════════════════════════════════
#  2. CURRENTLY LIVE — MVP FEATURE SET
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("2. Currently Live — MVP Feature Set", h1))
story.append(rule())
story.append(Paragraph(
    "The following features are fully built and working in the current Docker-based Flask application. "
    "This is a solid, clean MVP with no outstanding TODOs or partial implementations.",
    body))

live_rows = [
    ["YouTube URL submission",       "Accepts youtube.com, youtu.be, embed/, and Shorts URLs. Extracts video ID via regex. Rejects invalid URLs gracefully with an error message."],
    ["Background processing",        "Transcription runs in a background thread. Client polls /api/status every 2 seconds and auto-redirects when complete. Shows 'Still processing' banner during processing."],
    ["Video metadata fetch",         "Scrapes YouTube HTML to extract video title, description, and thumbnail. Falls back to video ID as title if metadata is unavailable."],
    ["Transcript grouping",          "Raw caption snippets are grouped into proper sentences using punctuation detection (full stop, exclamation mark, question mark). Each sentence stores its start timestamp."],
    ["Timestamped transcript viewer","Each sentence is displayed with a clickable timestamp button. Clicking the timestamp seeks the embedded YouTube player to that exact position via the YouTube postMessage API."],
    ["Embedded YouTube player",      "YouTube iframe embedded on the video detail page. Syncs with timestamp buttons in the transcript panel for seamless navigation."],
    ["Transcript search",            "Real-time keyword filter in the transcript panel. Non-matching lines are hidden instantly as the user types. No page reload required."],
    ["URL detection & screenshots",  "Regex extracts all HTTP/HTTPS URLs mentioned in the transcript. Playwright captures 1280x900px PNG screenshots of each URL. Failures are handled gracefully."],
    ["Links & screenshots panel",    "Dedicated panel showing all extracted URLs with their timestamps, clickable links, and screenshot thumbnails. Timestamps also seek the YouTube player."],
    ["Notes panel",                  "Per-video textarea for user notes. Saved via /api/notes POST. Shows a brief 'Saved ✓' confirmation. Notes persist across sessions in the server-side JSON store."],
    ["ZIP export",                   "Downloads a ZIP containing: transcript PDF (with screenshots embedded), notes.txt, links.txt, and a screenshots/ folder with all captured PNGs."],
    ["5 colour themes",              "Dark, Light, Ocean, Forest, and Sunset themes with full CSS variable coverage. Selected theme persists in localStorage across sessions."],
    ["Video library (home page)",    "Grid of all processed videos with thumbnails, titles, and processing dates. Sorted newest first. Status badges for in-progress or failed videos."],
    ["Duplicate detection",          "If a URL has already been processed, the app redirects immediately to the existing result page without re-processing."],
    ["Responsive layout",            "Two-column layout on desktop (>900px), single column on mobile. Sticky topbar. Scrollable transcript panel with fixed height."],
    ["JSON storage layer",           "All data stored as JSON files in output/{video_id}/. Storage module is designed to be swapped for a database (Supabase, PostgreSQL) without changes to other modules."],
    ["Docker deployment",            "Fully containerised via Docker and docker-compose. Runs on port 5000."],
]
lt = Table(
    [[hdr("Feature"), hdr("Detail")]] +
    [[lbl(r[0]), sm(r[1])] for r in live_rows],
    colWidths=[W*0.28, W*0.72]
)
lt.setStyle(TableStyle(BASE_STYLE))
story.append(lt)

# ══════════════════════════════════════════════════════════════════════════════
#  3. PHASE 1 — AUTH & BILLING
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("3. Phase 1 — Authentication &amp; Subscription Billing", h1))
story.append(rule())
story.append(Paragraph(
    "Phase 1 transforms the MVP into a commercial SaaS product. It introduces user accounts, a free trial, "
    "and paid subscription tiers. All auth and billing is handled via <b>Clerk</b> (authentication + billing UI) "
    "and <b>Stripe</b> (payment processing).",
    body))

p1_rows = [
    ["Clerk authentication",   "Email/password and social login (Google, GitHub). Clerk handles session management, JWTs, and password reset flows. Flask middleware validates the Clerk session token on protected routes.", "Critical"],
    ["User accounts",          "Each user has their own video library. Videos are scoped to the authenticated user — no user can see another's transcripts. Replaces the current shared JSON store.", "Critical"],
    ["Free trial (3 videos)",  "New users get 3 free transcriptions with full features. Card required upfront. Trial is one-time per account. After 3 videos, user must subscribe to continue.", "Critical"],
    ["Subscription tiers",     "Three paid tiers: Creator (£7/mo, 15 videos), Studio (£19/mo, 60 videos), Enterprise (£45/mo, unlimited). Managed via Clerk Billing + Stripe. Tier enforced server-side.", "Critical"],
    ["Feature gating by plan", "Creator tier: core transcript + export only (no URL screenshots in ZIP, no transcript search). Studio: all current features. Enterprise: all features + future team tools.", "Critical"],
    ["Credit/quota tracking",  "Server tracks how many videos each user has processed this billing period. Shows remaining credits on the dashboard. Resets monthly on billing date.", "High"],
    ["Billing portal",         "Clerk's built-in billing portal lets users upgrade, downgrade, and cancel their subscription without contacting support. Accessible from account settings.", "High"],
    ["Upgrade prompts",        "When a user hits their monthly limit or tries to access a gated feature, show a contextual upgrade prompt rather than a generic error.", "High"],
    ["Account settings page",  "User can view their current plan, usage this period, billing history, and update their email or password. Links to Clerk billing portal.", "Medium"],
    ["Database migration",     "Replace JSON file storage with a proper database (PostgreSQL via Supabase or Railway). Required for multi-user isolation, query performance, and backup reliability.", "Critical"],
]
p1t = Table(
    [[hdr("Feature"), hdr("Description"), hdr("Priority")]] +
    [[lbl(r[0]), sm(r[1]), priority(r[2])] for r in p1_rows],
    colWidths=[W*0.24, W*0.62, W*0.14]
)
p1t.setStyle(TableStyle(BASE_STYLE))
story.append(p1t)

# ══════════════════════════════════════════════════════════════════════════════
#  4. PHASE 2 — COLLECTIONS, SHARING & COLLABORATION
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("4. Phase 2 — Collections, Sharing &amp; Collaboration", h1))
story.append(rule())
story.append(Paragraph(
    "Phase 2 focuses on organisation and discoverability — helping users manage a growing library of transcripts, "
    "share content with others, and begin laying the groundwork for team use cases.",
    body))

p2_rows = [
    ["Collections / folders",   "Users can create named collections (e.g. 'Research', 'Podcasts', 'Client Videos') and assign videos to them. Collections appear in the sidebar. Videos can belong to multiple collections.", "Creator+"],
    ["Video tagging",           "Add freeform tags to videos (e.g. '#marketing', '#interview'). Filter the library by tag. Tags are searchable across the whole library.", "Creator+"],
    ["Library search",          "Global search across all video titles, descriptions, and transcript text. Returns matching videos with a snippet of the matching sentence highlighted.", "Studio+"],
    ["Share links",             "Generate a public read-only share link for any transcript. Recipient can view the transcript, timestamps, and links panel — but not notes. Links can be revoked.", "Studio+"],
    ["Share link expiry",       "Optional expiry on share links (24 hours, 7 days, 30 days, never). Expired links show a friendly 'This link has expired' page.", "Studio+"],
    ["Video deletion",          "Users can delete videos from their library. Removes all associated files. Soft-delete with 30-day recovery window before permanent removal.", "All"],
    ["Bulk actions",            "Select multiple videos on the home page. Bulk delete, bulk add to collection, or bulk export as a multi-video ZIP.", "Studio+"],
    ["Video renaming",          "Allow users to override the auto-fetched video title with a custom name in their library. Useful when YouTube titles are vague.", "All"],
    ["Team workspaces",         "Enterprise users can invite team members to a shared workspace. All team members can view and search the shared video library. Roles: Owner, Editor, Viewer.", "Enterprise"],
    ["Workspace activity feed", "Shows recent activity in a team workspace — who processed what, when. Useful for research teams and content agencies.", "Enterprise"],
]
p2t = Table(
    [[hdr("Feature"), hdr("Description"), hdr("Tier")]] +
    [[lbl(r[0]), sm(r[1]), cell(r[2])] for r in p2_rows],
    colWidths=[W*0.24, W*0.62, W*0.14]
)
p2t.setStyle(TableStyle(BASE_STYLE))
story.append(p2t)

# ══════════════════════════════════════════════════════════════════════════════
#  5. PHASE 3 — AI FEATURES & AUTOMATION
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("5. Phase 3 — AI Features &amp; Automation", h1))
story.append(rule())
story.append(Paragraph(
    "Phase 3 introduces AI-powered features using the Claude API (Haiku model for cost efficiency) and automation "
    "tools that allow the product to run without the user needing to manually submit each video.",
    body))

p3_rows = [
    ["AI chapter markers",             "Claude analyses the full transcript and generates named chapter markers with timestamps (e.g. '0:00 — Introduction', '4:32 — Key Argument'). Displayed above the transcript panel. Clickable — seeks the player.", "Haiku ~£0.01/use"],
    ["AI summary",                     "One-paragraph summary of the video generated from the transcript. Appears at the top of the video detail page. Toggle to show/hide. Included in the ZIP export.", "Haiku ~£0.005/use"],
    ["Key quotes extraction",          "Claude identifies the 5-10 most quotable or important sentences from the transcript and highlights them in the transcript viewer. Useful for journalists and researchers.", "Haiku ~£0.008/use"],
    ["Action items extraction",        "For instructional or meeting-style videos, Claude extracts a list of action items or takeaways from the transcript. Shown in a dedicated panel.", "Haiku ~£0.005/use"],
    ["Transcript correction",          "Inline editor allowing users to fix transcript errors (typos, misheard words). Changes saved back to the stored transcript. A 'corrected' badge shows on the video card.", "No AI — user edits"],
    ["Auto-translation",               "Translate the transcript into another language using Claude. Supports major languages. Translated transcript shown alongside the original with toggle. Included in export.", "Haiku ~£0.02/use"],
    ["Scheduled transcription — channel", "User provides a YouTube channel URL. The app polls daily for new uploads and auto-processes them. New transcripts appear in the library automatically.", "Background worker"],
    ["Scheduled transcription — playlist","User provides a playlist URL. All current and future videos in the playlist are automatically transcribed as they are added.", "Background worker"],
    ["Email digest",                   "Weekly email showing new transcripts processed from watched channels/playlists, with links to view each one. Sent via Brevo.", "Brevo free tier"],
    ["Webhook notifications",          "When a new scheduled transcription completes, fire a webhook to a user-specified URL (e.g. n8n, Zapier, Slack). Useful for power users integrating into workflows.", "Studio+ / Enterprise"],
]
p3t = Table(
    [[hdr("Feature"), hdr("Description"), hdr("Model / Cost Est.")]] +
    [[lbl(r[0]), sm(r[1]), cell(r[2])] for r in p3_rows],
    colWidths=[W*0.27, W*0.55, W*0.18]
)
p3t.setStyle(TableStyle(BASE_STYLE))
story.append(p3t)

# ══════════════════════════════════════════════════════════════════════════════
#  6. FUTURE IDEAS — V2 AND BEYOND
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("6. Future Ideas — v2 and Beyond", h1))
story.append(rule())
story.append(Paragraph(
    "The following features are not planned for the immediate roadmap but represent high-value opportunities "
    "for future versions. They are ranked roughly by user impact and development effort.",
    body))

story.append(Paragraph("Product Expansion", h2))
prod_rows = [
    ["Podcast / audio file support", "Extends YT Transcriber beyond YouTube to any audio or video file. Major market expansion — podcasters, journalists recording interviews, corporate meetings.", "High"],
    ["Browser extension",            "One-click transcription from the YouTube page itself. No need to copy/paste the URL. Strong acquisition channel — discoverable in the Chrome Web Store.", "Medium"],
    ["Chrome extension with overlay","Shows transcript as a real-time overlay on the YouTube page. Power users can read along while watching without switching tabs.", "High"],
    ["Mobile app (iOS / Android)",   "Native app for consuming transcripts on the go. Share Sheet integration — share a YouTube link from the iOS YouTube app directly to YT Transcriber.", "Very High"],
    ["Bulk URL import",              "Paste a list of YouTube URLs (or a channel/playlist) and process them all in one go. Results available when batch is complete.", "Low"],
    ["Transcript comparison",        "Side-by-side comparison of two transcripts — useful for researchers comparing two interviews or lectures on the same topic.", "Medium"],
    ["Custom branding on exports",   "Enterprise users can add their own logo and brand colours to exported PDFs and Word docs. White-label option for agencies.", "Low"],
    ["Public profile / portfolio",   "Optional public page showing a user's published transcripts. Good for researchers who want to share curated video content publicly.", "Medium"],
]
pe_t = Table(
    [[hdr("Feature"), hdr("Why It's Valuable"), hdr("Effort")]] +
    [[lbl(r[0]), sm(r[1]), effort(r[2])] for r in prod_rows],
    colWidths=[W*0.27, W*0.59, W*0.14]
)
pe_t.setStyle(TableStyle(BASE_STYLE))
story.append(pe_t)

story.append(Spacer(1, 10))
story.append(Paragraph("AI &amp; Intelligence", h2))
ai_rows = [
    ["Semantic transcript search",    "Search by meaning rather than exact keywords. 'Moments where they discuss pricing' surfaces relevant sections even if the word 'pricing' is not used. Powered by embeddings.", "High"],
    ["Cross-video question answering", "Ask a question across your entire library — 'What did these 10 speakers say about AI regulation?' — and get a synthesised answer with source citations.", "High"],
    ["Speaker diarisation",           "Identify and label different speakers in the transcript (Speaker 1, Speaker 2, etc.). Essential for interviews and panel discussions.", "High"],
    ["Sentiment analysis",            "Highlight sections of the transcript by sentiment (positive, neutral, negative). Useful for brand monitoring and competitor research.", "Medium"],
    ["Clip generation suggestions",   "Claude identifies the 3-5 most shareable moments from the transcript and flags them as clip suggestions with timestamps — ideal for content creators.", "Medium"],
    ["Auto-tagging",                  "Claude automatically suggests tags for each video based on transcript content. Saves manual tagging and improves library organisation.", "Low"],
    ["Reading difficulty score",      "Rate how technical or accessible the content is. Useful for educators and researchers assessing content suitability.", "Low"],
]
ai_t = Table(
    [[hdr("Feature"), hdr("Why It's Valuable"), hdr("Effort")]] +
    [[lbl(r[0]), sm(r[1]), effort(r[2])] for r in ai_rows],
    colWidths=[W*0.27, W*0.59, W*0.14]
)
ai_t.setStyle(TableStyle(BASE_STYLE))
story.append(ai_t)

story.append(Spacer(1, 10))
story.append(Paragraph("Export &amp; Integrations", h2))
exp_rows = [
    ["Notion integration",        "Export any transcript directly to a Notion page. One of the most-requested features for knowledge workers who use Notion as their second brain.", "Medium"],
    ["Obsidian / Markdown export","Export transcript as a clean Markdown file with YAML frontmatter (title, date, URL). Zero-friction for Obsidian, Logseq, and Bear users.", "Low"],
    ["Google Docs export",        "Push a transcript to a new Google Doc in the user's Drive. Formatted with headings, timestamps, and a summary section.", "Medium"],
    ["Subtitle / SRT file export","Export the transcript as a .srt subtitle file. Useful for creators who want to add captions to re-uploaded or edited versions of the video.", "Low"],
    ["Zapier / Make integration", "Trigger a Zapier or Make workflow when a new transcription completes. Opens YT Transcriber to hundreds of downstream automations.", "Medium"],
    ["Slack integration",         "Post a transcript summary and link to a Slack channel when a new video is processed. Especially useful for team workspaces.", "Low"],
    ["RSS feed per channel",      "Subscribe to a watched YouTube channel via RSS. New transcripts appear in the user's RSS reader automatically.", "Low"],
]
ex_t = Table(
    [[hdr("Feature"), hdr("Why It's Valuable"), hdr("Effort")]] +
    [[lbl(r[0]), sm(r[1]), effort(r[2])] for r in exp_rows],
    colWidths=[W*0.27, W*0.59, W*0.14]
)
ex_t.setStyle(TableStyle(BASE_STYLE))
story.append(ex_t)

# ══════════════════════════════════════════════════════════════════════════════
#  7. FULL FEATURE STATUS SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("7. Full Feature Status Summary", h1))
story.append(rule())
story.append(Paragraph("A consolidated view of every feature across all phases for quick reference.", body))

all_features = [
    # Feature, Phase, Tier
    ("YouTube URL submission",           "Live",    "All"),
    ("Background processing",            "Live",    "All"),
    ("Video metadata fetch",             "Live",    "All"),
    ("Transcript grouping",              "Live",    "All"),
    ("Timestamped transcript viewer",    "Live",    "All"),
    ("Embedded YouTube player",          "Live",    "All"),
    ("Real-time transcript search",      "Live",    "Studio+"),
    ("URL detection & screenshots",      "Live",    "Studio+"),
    ("Links & screenshots panel",        "Live",    "Studio+"),
    ("Notes panel",                      "Live",    "All"),
    ("ZIP export",                       "Live",    "All"),
    ("5 colour themes",                  "Live",    "All"),
    ("Video library / home page",        "Live",    "All"),
    ("Duplicate detection",              "Live",    "All"),
    ("Responsive layout",                "Live",    "All"),
    ("Clerk authentication",             "Phase 1", "All"),
    ("User accounts & isolation",        "Phase 1", "All"),
    ("Free trial (3 videos)",            "Phase 1", "All"),
    ("Subscription tiers",               "Phase 1", "All"),
    ("Feature gating by plan",           "Phase 1", "All"),
    ("Credit / quota tracking",          "Phase 1", "All"),
    ("Billing portal (Clerk)",           "Phase 1", "All"),
    ("Upgrade prompts",                  "Phase 1", "All"),
    ("Account settings page",            "Phase 1", "All"),
    ("Database migration (PostgreSQL)",  "Phase 1", "All"),
    ("Collections / folders",            "Phase 2", "Creator+"),
    ("Video tagging",                    "Phase 2", "Creator+"),
    ("Library search",                   "Phase 2", "Studio+"),
    ("Share links",                      "Phase 2", "Studio+"),
    ("Share link expiry",                "Phase 2", "Studio+"),
    ("Video deletion",                   "Phase 2", "All"),
    ("Bulk actions",                     "Phase 2", "Studio+"),
    ("Video renaming",                   "Phase 2", "All"),
    ("Team workspaces",                  "Phase 2", "Enterprise"),
    ("Workspace activity feed",          "Phase 2", "Enterprise"),
    ("AI chapter markers",               "Phase 3", "Studio+"),
    ("AI summary",                       "Phase 3", "Studio+"),
    ("Key quotes extraction",            "Phase 3", "Studio+"),
    ("Action items extraction",          "Phase 3", "Studio+"),
    ("Transcript correction",            "Phase 3", "All"),
    ("Auto-translation",                 "Phase 3", "Studio+"),
    ("Scheduled transcription — channel","Phase 3", "Studio+"),
    ("Scheduled transcription — playlist","Phase 3","Studio+"),
    ("Email digest",                     "Phase 3", "All"),
    ("Webhook notifications",            "Phase 3", "Studio+"),
    ("Podcast / audio file support",     "Future",  "TBD"),
    ("Browser extension",                "Future",  "All"),
    ("Mobile app",                       "Future",  "TBD"),
    ("Bulk URL import",                  "Future",  "Studio+"),
    ("Semantic transcript search",       "Future",  "Studio+"),
    ("Cross-video question answering",   "Future",  "Studio+"),
    ("Speaker diarisation",              "Future",  "Studio+"),
    ("Notion integration",               "Future",  "All"),
    ("Obsidian / Markdown export",       "Future",  "All"),
    ("Google Docs export",               "Future",  "All"),
    ("SRT subtitle export",              "Future",  "All"),
    ("Zapier / Make integration",        "Future",  "Studio+"),
    ("Clip generation suggestions",      "Future",  "Studio+"),
    ("Custom branding on exports",       "Future",  "Enterprise"),
]

summary_t = Table(
    [[hdr("Feature"), hdr("Phase"), hdr("Tier")]] +
    [[lbl(r[0]), phase(r[1]), cell(r[2])] for r in all_features],
    colWidths=[W*0.57, W*0.22, W*0.21]
)
summary_t.setStyle(TableStyle(BASE_STYLE))
story.append(summary_t)

# ══════════════════════════════════════════════════════════════════════════════
#  8. RECOMMENDED BUILD ORDER
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("8. Recommended Build Order", h1))
story.append(rule())
story.append(Paragraph(
    "The following sequence is recommended to maximise value delivered at each step while minimising rework. "
    "Each milestone produces a shippable, monetisable product.",
    body))

milestones = [
    ["M1 — Auth & Free Trial",   "Phase 1",   "Clerk auth, user accounts, database migration. Free trial (3 videos). Gate features by plan. This is the minimum needed to charge money."],
    ["M2 — Billing & Tiers",     "Phase 1",   "Stripe via Clerk. Creator, Studio, Enterprise tiers. Billing portal, upgrade prompts, credit tracking. Soft launch to first paying users."],
    ["M3 — Organisation",        "Phase 2",   "Collections, tagging, video deletion, renaming. Core library management. Low effort, high user satisfaction impact."],
    ["M4 — Sharing",             "Phase 2",   "Share links with optional expiry. Public read-only view. Viral acquisition loop — shared transcripts drive new signups."],
    ["M5 — AI Features",         "Phase 3",   "AI chapter markers, summary, key quotes. These are clear upgrade incentives for Creator → Studio. Use Claude Haiku to keep costs low."],
    ["M6 — Transcript Tools",    "Phase 3",   "Transcript correction, auto-translation. High value for researchers and international users. Deepens Studio/Enterprise stickiness."],
    ["M7 — Automation",          "Phase 3",   "Scheduled channel/playlist transcription, email digest, webhooks. Transitions YT Transcriber from a tool to a platform."],
    ["M8 — Team Features",       "Phase 2/3", "Team workspaces, shared libraries, activity feed. Unlocks B2B expansion and justifies Enterprise pricing."],
    ["M9 — Integrations",        "Future",    "Notion, Google Docs, Obsidian, Zapier. Embeds YT Transcriber into existing user workflows. Significant retention driver."],
    ["M10 — Platform Expansion", "Future",    "Browser extension, podcast/audio support, mobile app. Each opens a new acquisition channel and a new market segment."],
]

def milestone_phase(p):
    if "Phase 1" in p: return Paragraph(p, ph_1)
    if "Phase 2" in p: return Paragraph(p, ph_2)
    if "Phase 3" in p: return Paragraph(p, ph_3)
    return Paragraph(p, ph_fut)

mt = Table(
    [[hdr("Milestone"), hdr("Phase"), hdr("Scope & Goal")]] +
    [[lbl(r[0]), milestone_phase(r[1]), sm(r[2])] for r in milestones],
    colWidths=[W*0.28, W*0.14, W*0.58]
)
mt.setStyle(TableStyle(BASE_STYLE))
story.append(mt)
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Note: Milestones M1–M2 are revenue-critical and should be completed before any Phase 2 or Phase 3 work begins. "
    "The product cannot scale commercially without a working auth and billing system.",
    note))

# ── Footer ─────────────────────────────────────────────────────────────────────
story.append(Spacer(1, 16))
story.append(HRFlowable(width="100%", thickness=0.5, color=MID_GREY))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "YT Transcriber — Confidential — Not for Distribution",
    S("Ftr", fontSize=7.5, textColor=MID_GREY, fontName="Helvetica", alignment=TA_CENTER)))

doc.multiBuild(story)
print(f"PDF saved to {OUTPUT}")
