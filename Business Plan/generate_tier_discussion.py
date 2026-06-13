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

OUTPUT    = r"Z:\GIT\Cursor\new project\youtube-transcriber\Business Plan\YT_Transcriber_Tier_Discussion.pdf"
LOGO_PATH = r"Z:\GIT\Cursor\new project\youtube-transcriber\Business Plan\logo_full@2x.png"

# ── Brand colours (confirmed spec) ───────────────────────────────────────────
RED       = colors.HexColor("#E53935")
RED_LIGHT = colors.HexColor("#ffebee")
DARK      = colors.HexColor("#0f0f0f")
SURFACE   = colors.HexColor("#2A2A2A")
LIGHT_BG  = colors.HexColor("#F5F5F5")
GRID_LINE = colors.HexColor("#e0c8c8")
WHITE     = colors.white
MUTED     = colors.HexColor("#888888")
BLACK     = colors.HexColor("#1a1a1a")
GREEN     = colors.HexColor("#2e7d32")
AMBER     = colors.HexColor("#e65100")
BLUE      = colors.HexColor("#1565C0")

# ── Styles ────────────────────────────────────────────────────────────────────
def S(name, **kw):
    return ParagraphStyle(name, **kw)

h1         = S("H1",        fontSize=18, textColor=BLACK,  spaceBefore=14, spaceAfter=6,  fontName="Helvetica-Bold")
h2         = S("H2",        fontSize=11, textColor=RED,    spaceBefore=10, spaceAfter=4,  fontName="Helvetica-Bold")
h3         = S("H3",        fontSize=10, textColor=BLACK,  spaceBefore=8,  spaceAfter=3,  fontName="Helvetica-Bold")
body       = S("Body",      fontSize=9,  textColor=BLACK,  spaceAfter=5,   fontName="Helvetica",      leading=14)
body_sm    = S("BodySm",    fontSize=8,  textColor=BLACK,  spaceAfter=3,   fontName="Helvetica",      leading=12)
bullet     = S("Bullet",    fontSize=9,  textColor=BLACK,  spaceAfter=3,   fontName="Helvetica",      leading=14, leftIndent=12)
note       = S("Note",      fontSize=8,  textColor=MUTED,  spaceAfter=4,   fontName="Helvetica-Oblique")
tbl_head   = S("TblHead",   fontSize=9,  textColor=WHITE,  fontName="Helvetica-Bold",  alignment=TA_CENTER)
tbl_cell   = S("TblCell",   fontSize=8.5,textColor=BLACK,  fontName="Helvetica",       alignment=TA_CENTER, leading=11)
tbl_label  = S("TblLabel",  fontSize=8.5,textColor=BLACK,  fontName="Helvetica-Bold",  alignment=TA_LEFT,   leading=11)
tbl_sub    = S("TblSub",    fontSize=7.5,textColor=MUTED,  fontName="Helvetica",       alignment=TA_CENTER, leading=10)
tag_free   = S("TagFree",   fontSize=9,  textColor=GREEN,  fontName="Helvetica-Bold",  alignment=TA_CENTER)
tag_pro    = S("TagPro",    fontSize=9,  textColor=BLUE,   fontName="Helvetica-Bold",  alignment=TA_CENTER)
tag_ent    = S("TagEnt",    fontSize=9,  textColor=AMBER,  fontName="Helvetica-Bold",  alignment=TA_CENTER)

# ── Helpers ───────────────────────────────────────────────────────────────────
# ── TOC support ───────────────────────────────────────────────────────────────
class TOCDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            if flowable.style.name == 'H1':
                self.notify('TOCEntry', (0, flowable.getPlainText(), self.page))

toc_entry_style = ParagraphStyle(
    'TOCEntry', fontName='Helvetica', fontSize=10, textColor=BLACK,
    spaceBefore=5, spaceAfter=1, leftIndent=0, leading=14
)

def build_toc():
    toc = TableOfContents()
    toc.levelStyles = [toc_entry_style]
    toc.dotsMinLevel = 0
    return toc

def tick():           return Paragraph("<font color='#2e7d32'>&#10003;</font>", tbl_cell)
def cross():          return Paragraph("<font color='#E53935'>&#10007;</font>", tbl_cell)
def partial(txt):     return Paragraph(f"<font color='#e65100'>{txt}</font>",   tbl_cell)
def hdr(txt):         return Paragraph(txt, tbl_head)
def cell(txt):        return Paragraph(txt, tbl_cell)
def lbl(txt):         return Paragraph(txt, tbl_label)
def sub(txt):         return Paragraph(txt, tbl_sub)
def rule():           return HRFlowable(width="100%", thickness=1, color=GRID_LINE, spaceAfter=4, spaceBefore=4)

BASE_STYLE = [
    ("BACKGROUND",    (0, 0), (-1, 0),  RED),
    ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, RED_LIGHT]),
    ("GRID",          (0, 0), (-1, -1), 0.4, GRID_LINE),
    ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING",    (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING",   (0, 0), (-1, -1), 7),
    ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
]

# ── Document ──────────────────────────────────────────────────────────────────
doc = TOCDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm,
    topMargin=15*mm, bottomMargin=15*mm,
    title="YT Transcriber — Tier Structure Discussion",
    author="YT Transcriber"
)
W = A4[0] - 36*mm
story = []

# ── Cover banner (matches business plan style) ────────────────────────────────
logo_w   = W * 0.58
logo_img = Image(LOGO_PATH, width=logo_w, height=logo_w / 5)

banner_top = Table(
    [[logo_img, Paragraph("INTERNAL", S("IT", fontSize=8, textColor=MUTED, fontName="Helvetica", alignment=TA_RIGHT))]],
    colWidths=[W * 0.75, W * 0.25]
)
banner_top.setStyle(TableStyle([
    ("BACKGROUND",    (0, 0), (-1, -1), DARK),
    ("TOPPADDING",    (0, 0), (-1, -1), 14),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ("LEFTPADDING",   (0, 0), (-1, -1), 14),
    ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
    ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
]))
story.append(banner_top)

banner_title = Table([[
    Paragraph("Tier Structure — Discussion Document", S("CT", fontSize=18, textColor=WHITE, fontName="Helvetica-Bold")),
    Paragraph(f"Prepared: {date.today().strftime('%d %B %Y')}", S("CD", fontSize=9, textColor=MUTED, fontName="Helvetica", alignment=TA_RIGHT))
]], colWidths=[W * 0.72, W * 0.28])
banner_title.setStyle(TableStyle([
    ("BACKGROUND",    (0, 0), (-1, -1), RED),
    ("TOPPADDING",    (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ("LEFTPADDING",   (0, 0), (-1, -1), 14),
    ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
    ("VALIGN",        (0, 0), (-1, -1), "BOTTOM"),
]))
story.append(banner_title)
story.append(Spacer(1, 12))

# ── Table of Contents ─────────────────────────────────────────────────────────
story.append(Paragraph("Contents", h1))
story.append(rule())
story.append(build_toc())
story.append(PageBreak())

# ── Intro ─────────────────────────────────────────────────────────────────────
story.append(Paragraph("Purpose of This Document", h1))
story.append(rule())
story.append(Paragraph(
    "This document is a working discussion on the subscription tier structure for YT Transcriber. "
    "It is not a final specification — pricing is intentionally excluded at this stage. "
    "The goal is to agree on <b>tier names</b> and <b>which features sit at each level</b>, "
    "with a focus on making the progression between tiers feel natural and earned rather than artificially gated.",
    body))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Three tiers are proposed: <b>Free</b>, <b>Pro</b>, and <b>Enterprise</b>. "
    "Each should feel like a complete, coherent product — not a stripped-down version of the one above it. "
    "The principle: <i>Free gives real value. Pro unlocks serious use. Enterprise enables teams.</i>",
    body))
story.append(Spacer(1, 8))

# ── Tier overview cards ───────────────────────────────────────────────────────
story.append(Paragraph("Tier Overview", h1))
story.append(rule())

tier_cards = Table([
    [
        Paragraph("FREE", tag_free),
        Paragraph("PRO", tag_pro),
        Paragraph("ENTERPRISE", tag_ent),
    ],
    [
        Paragraph("<b>Try it out</b>", S("tc", fontSize=10, textColor=BLACK, fontName="Helvetica-Bold", alignment=TA_CENTER)),
        Paragraph("<b>Serious use</b>", S("tc2", fontSize=10, textColor=BLACK, fontName="Helvetica-Bold", alignment=TA_CENTER)),
        Paragraph("<b>Team &amp; power</b>", S("tc3", fontSize=10, textColor=BLACK, fontName="Helvetica-Bold", alignment=TA_CENTER)),
    ],
    [
        Paragraph("No card required.<br/>Limited videos.<br/>Core features only.", S("td", fontSize=9, textColor=BLACK, fontName="Helvetica", alignment=TA_CENTER, leading=14)),
        Paragraph("Unlimited videos.<br/>All core + advanced features.<br/>Monthly subscription.", S("td2", fontSize=9, textColor=BLACK, fontName="Helvetica", alignment=TA_CENTER, leading=14)),
        Paragraph("Everything in Pro.<br/>Team workspaces, API access,<br/>scheduled automation.", S("td3", fontSize=9, textColor=BLACK, fontName="Helvetica", alignment=TA_CENTER, leading=14)),
    ],
    [
        Paragraph("Target: curious users,<br/>students, light use", S("tt", fontSize=8, textColor=MUTED, fontName="Helvetica-Oblique", alignment=TA_CENTER, leading=12)),
        Paragraph("Target: content creators,<br/>researchers, professionals", S("tt2", fontSize=8, textColor=MUTED, fontName="Helvetica-Oblique", alignment=TA_CENTER, leading=12)),
        Paragraph("Target: agencies, teams,<br/>power users, B2B", S("tt3", fontSize=8, textColor=MUTED, fontName="Helvetica-Oblique", alignment=TA_CENTER, leading=12)),
    ],
], colWidths=[W/3, W/3, W/3])

tier_cards.setStyle(TableStyle([
    ("BACKGROUND",    (0, 0), (0, -1), colors.HexColor("#f1f8f1")),
    ("BACKGROUND",    (1, 0), (1, -1), colors.HexColor("#e8f0fb")),
    ("BACKGROUND",    (2, 0), (2, -1), colors.HexColor("#fff8e1")),
    ("BOX",           (0, 0), (0, -1), 1, colors.HexColor("#2e7d32")),
    ("BOX",           (1, 0), (1, -1), 1, colors.HexColor("#1565C0")),
    ("BOX",           (2, 0), (2, -1), 1, colors.HexColor("#e65100")),
    ("TOPPADDING",    (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("LEFTPADDING",   (0, 0), (-1, -1), 10),
    ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
    ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ("LINEBELOW",     (0, 0), (-1, 0), 0.5, GRID_LINE),
    ("LINEBELOW",     (0, 1), (-1, 1), 0.5, GRID_LINE),
    ("LINEBELOW",     (0, 2), (-1, 2), 0.5, GRID_LINE),
]))
story.append(tier_cards)
story.append(Spacer(1, 14))

# ── Full feature matrix ───────────────────────────────────────────────────────
story.append(Paragraph("Feature Matrix", h1))
story.append(rule())
story.append(Paragraph(
    "The table below shows the proposed feature allocation across all three tiers. "
    "Features marked with a note are discussed in detail in the following section.",
    body))
story.append(Spacer(1, 6))

# Column widths: label, Free, Pro, Enterprise
cw = [W * 0.46, W * 0.18, W * 0.18, W * 0.18]

def section_row(label):
    """A full-width grey section divider row."""
    return [
        Paragraph(f"<b>{label}</b>", S("SR", fontSize=8.5, textColor=WHITE, fontName="Helvetica-Bold")),
        Paragraph("", tbl_cell), Paragraph("", tbl_cell), Paragraph("", tbl_cell)
    ]

SR_STYLE = ("BACKGROUND", None, None, SURFACE)  # placeholder, applied per-row below

rows = [
    # header
    [hdr("Feature"), hdr("Free"), hdr("Pro"), hdr("Enterprise")],

    # ── Transcription core
    section_row("Transcription"),
    [lbl("YouTube URL submission"),              tick(),  tick(),  tick()],
    [lbl("Transcript viewer"),                   tick(),  tick(),  tick()],
    [lbl("Timestamped sentences"),               tick(),  tick(),  tick()],
    [lbl("Clickable timestamps → video player"), tick(),  tick(),  tick()],
    [lbl("Real-time transcript search"),         tick(),  tick(),  tick()],
    [lbl("Duplicate detection"),                 tick(),  tick(),  tick()],
    [lbl("Monthly video limit"),                 cell("3 videos"), cell("Unlimited"), cell("Unlimited")],

    # ── Export
    section_row("Export"),
    [lbl("Plain text (.txt) export"),            tick(),  tick(),  tick()],
    [lbl("PDF transcript export"),               cross(), tick(),  tick()],
    [lbl("Word document (.docx) export"),        cross(), tick(),  tick()],
    [lbl("ZIP archive (transcript + assets)"),   cross(), tick(),  tick()],
    [lbl("SRT subtitle file export"),            cross(), tick(),  tick()],

    # ── Notes & organisation
    section_row("Notes & Organisation"),
    [lbl("Per-video notes panel"),               tick(),  tick(),  tick()],
    [lbl("Video renaming (custom title)"),       tick(),  tick(),  tick()],
    [lbl("Video deletion"),                      tick(),  tick(),  tick()],
    [lbl("Collections / folders"),               cross(), tick(),  tick()],
    [lbl("Video tagging"),                       cross(), tick(),  tick()],
    [lbl("Library search (across all videos)"),  cross(), tick(),  tick()],

    # ── Sharing
    section_row("Sharing"),
    [lbl("Shareable read-only transcript link"), cross(), tick(),  tick()],
    [lbl("Share link expiry (24h / 7d / 30d)"),  cross(), tick(),  tick()],
    [lbl("Download permission on share link"),   cross(), tick(),  tick()],

    # ── Link & URL features
    section_row("Link & URL Features"),
    [lbl("URL detection in transcript"),         tick(),  tick(),  tick()],
    [lbl("URL screenshots (via screenshot API)"),cross(), tick(),  tick()],
    [lbl("Links panel with timestamps"),         tick(),  tick(),  tick()],

    # ── AI features
    section_row("AI Features"),
    [lbl("AI chapter markers"),                  cross(), tick(),  tick()],
    [lbl("AI summary (one paragraph)"),          cross(), tick(),  tick()],
    [lbl("Key quotes extraction"),               cross(), tick(),  tick()],
    [lbl("Action items extraction"),             cross(), tick(),  tick()],
    [lbl("Transcript correction (inline edit)"), cross(), tick(),  tick()],
    [lbl("Auto-translation"),                    cross(), tick(),  tick()],

    # ── Automation (Enterprise only)
    section_row("Automation & API"),
    [lbl("Scheduled channel transcription"),     cross(), cross(), tick()],
    [lbl("Scheduled playlist transcription"),    cross(), cross(), tick()],
    [lbl("Email digest (weekly summary)"),       cross(), tick(),  tick()],
    [lbl("Webhook notifications"),               cross(), cross(), tick()],
    [lbl("REST API access"),                     cross(), cross(), tick()],

    # ── Team
    section_row("Team & Workspace"),
    [lbl("Team workspace (shared library)"),     cross(), cross(), tick()],
    [lbl("Team roles (Owner / Editor / Viewer)"),cross(), cross(), tick()],
    [lbl("Workspace activity feed"),             cross(), cross(), tick()],
    [lbl("Custom branding on exports"),          cross(), cross(), tick()],

    # ── Platform
    section_row("Platform"),
    [lbl("Themes (5 colour options)"),           tick(),  tick(),  tick()],
    [lbl("Priority processing"),                 cross(), cross(), tick()],
    [lbl("Billing portal (self-service)"),       cross(), tick(),  tick()],
    [lbl("Account settings page"),               tick(),  tick(),  tick()],
]

# Build table style — section rows get dark background
section_indices = [i for i, r in enumerate(rows) if isinstance(r[0], Paragraph) and r[0].text.startswith("<b>") and r[1].text == ""]
ts = list(BASE_STYLE)
for idx in section_indices:
    ts.append(("BACKGROUND",   (0, idx), (-1, idx), SURFACE))
    ts.append(("TEXTCOLOR",    (0, idx), (-1, idx), WHITE))
    ts.append(("SPAN",         (0, idx), (-1, idx)))

matrix = Table(rows, colWidths=cw)
matrix.setStyle(TableStyle(ts))
story.append(matrix)
story.append(Spacer(1, 6))

# Legend
key_data = [[
    Paragraph("&#10003;", S("gn", fontSize=10, textColor=GREEN, fontName="Helvetica-Bold", alignment=TA_CENTER)),
    Paragraph("Included", body_sm),
    Spacer(6, 1),
    Paragraph("&#10007;", S("rd", fontSize=10, textColor=RED, fontName="Helvetica-Bold", alignment=TA_CENTER)),
    Paragraph("Not included", body_sm),
]]
key_t = Table(key_data, colWidths=[8*mm, 30*mm, 6*mm, 8*mm, 30*mm])
key_t.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2)]))
story.append(key_t)

# ── Discussion notes ──────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(Paragraph("Discussion Notes", h1))
story.append(rule())
story.append(Paragraph(
    "The following notes explain the reasoning behind key placement decisions and flag items "
    "that may benefit from further discussion before the tier structure is finalised.",
    body))
story.append(Spacer(1, 8))

notes = [
    (
        "Transcript search on Free",
        "Search is kept on Free because it is a core part of reading a transcript — hiding it would "
        "make the free experience feel broken rather than limited. Users who find value in search on "
        "Free are more likely to upgrade for volume and export, not because search was taken away.",
        "KEEP on Free — this is a usability feature, not a power feature."
    ),
    (
        "URL detection on Free vs URL screenshots on Pro",
        "Detecting links in the transcript (showing them in the links panel) is a core transcript feature "
        "and should be free. Taking screenshots of those URLs is computationally expensive — it calls an "
        "external screenshot API per URL. Keeping it on Pro is justified by the real cost and the 'wow factor' "
        "it creates as an upgrade hook.",
        "SPLIT: detection = Free, screenshots = Pro. This feels natural, not gated."
    ),
    (
        "AI features on Pro (not Enterprise)",
        "AI chapters, summaries, and quotes are placed on Pro rather than Enterprise because they are "
        "the primary upgrade hook for individual users. Reserving them for Enterprise would undermine the "
        "value of Pro and push the perceived price of AI too high. Enterprise's differentiation comes "
        "from team features and automation, not AI.",
        "AI on Pro — key upgrade driver for individuals."
    ),
    (
        "Transcript correction on Pro",
        "Inline transcript editing is a lightweight feature technically, but it implies a level of investment "
        "in the content — the user is treating the transcript as a working document. This fits the Pro "
        "persona (content creators, researchers) well.",
        "KEEP on Pro — low build cost, good persona fit."
    ),
    (
        "Email digest on Pro (not Enterprise only)",
        "A weekly summary email of new transcripts is low-cost to send and increases weekly active use. "
        "Putting it on Pro gives active solo users a reason to stay engaged. Enterprise gets the more powerful "
        "version: webhook notifications and scheduled automation.",
        "Email digest = Pro. Webhooks + automation = Enterprise."
    ),
    (
        "Collections / folders on Pro",
        "Organisation features make sense only once a user has enough videos to need them. Free users are "
        "limited to 3 videos total, so folders on Free would be wasted. Pro unlocks unlimited videos, at "
        "which point folders become genuinely useful.",
        "KEEP on Pro — no use case on Free at 3-video limit."
    ),
    (
        "Tier name alternatives worth considering",
        "Current working names: Free / Pro / Enterprise. Alternatives that could be considered: "
        "<b>Free / Creator / Studio</b> (from Model C in the Clerk Proposal) — these are more identity-led "
        "and aspirational. 'Pro' is clear but generic. 'Creator' and 'Studio' signal who the product is for. "
        "Enterprise is strong and widely understood for the top tier.",
        "DISCUSS: Free / Pro / Enterprise vs Free / Creator / Studio. Both work — one is clearer, one is more branded."
    ),
    (
        "Features intentionally not listed",
        "The following are on the longer-term roadmap and are not allocated to a tier yet: "
        "podcast/audio file support, browser extension, mobile app, Notion/Google Docs integrations, "
        "semantic search, speaker diarisation, Zapier/Make webhooks. These will be added to this document "
        "once development timelines are clearer.",
        "Backlog items — tier placement TBD."
    ),
]

for title, detail, recommendation in notes:
    story.append(KeepTogether([
        Paragraph(title, h2),
        Paragraph(detail, body),
        Table(
            [[Paragraph("&#9654;  " + recommendation, S("REC", fontSize=8.5, textColor=BLUE, fontName="Helvetica-Bold", leading=12))]],
            colWidths=[W]
        ),
        Spacer(1, 8),
    ]))

# ── Next steps ────────────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(Paragraph("Next Steps", h1))
story.append(rule())

steps = [
    "<b>Agree tier names</b> — confirm Free / Pro / Enterprise or choose identity-led alternatives (e.g. Free / Creator / Studio).",
    "<b>Review feature placement</b> — use the discussion notes above to confirm or adjust which features sit at each tier.",
    "<b>Agree video limits on Free</b> — current proposal is 3 videos total (lifetime, not monthly). A permanent monthly free tier (3/mo) is an alternative that drives ongoing engagement.",
    "<b>Define Pro volume</b> — Pro is currently unlimited. An alternative is a generous monthly cap (e.g. 60 videos/mo) to create a natural Enterprise upsell for heavy users.",
    "<b>Pricing discussion (separate session)</b> — once features are confirmed, pricing can be set based on competitive research and ARPU targets from the revenue models in the Clerk Proposal.",
    "<b>Update the build plan</b> — once tiers are confirmed, the feature flag table in the database schema and the Next.js build plan can be finalised.",
]
for step in steps:
    story.append(Paragraph(f"&#8226;  {step}", bullet))

story.append(Spacer(1, 20))
story.append(HRFlowable(width="100%", thickness=0.5, color=GRID_LINE))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "YT Transcriber — Internal Discussion Document — Not for Distribution",
    S("Footer", fontSize=7.5, textColor=MUTED, fontName="Helvetica", alignment=TA_CENTER)
))

doc.multiBuild(story)
print(f"PDF saved to {OUTPUT}")
