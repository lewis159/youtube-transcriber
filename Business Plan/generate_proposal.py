from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import date

OUTPUT     = r"Z:\GIT\Cursor\new project\youtube-transcriber\business plan\YT_Transcriber_Clerk_Proposal.pdf"
LOGO_PATH  = r"Z:\GIT\Cursor\new project\youtube-transcriber\business plan\logo_full@2x.png"

# ── Colours ──────────────────────────────────────────────────────────────────
RED      = colors.HexColor("#E53935")
DARK_BG  = colors.HexColor("#1A1A1A")
SURFACE  = colors.HexColor("#2A2A2A")
LIGHT_BG = colors.HexColor("#F5F5F5")
MID_GREY = colors.HexColor("#CCCCCC")
DK_GREY  = colors.HexColor("#555555")
WHITE    = colors.white
GREEN    = colors.HexColor("#4CAF50")
AMBER    = colors.HexColor("#F59E0B")
BLUE     = colors.HexColor("#3B82F6")

# ── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

h1            = S("H1",           fontSize=18, textColor=DARK_BG,  spaceBefore=14, spaceAfter=6,  fontName="Helvetica-Bold")
h2            = S("H2",           fontSize=13, textColor=RED,      spaceBefore=10, spaceAfter=4,  fontName="Helvetica-Bold")
body          = S("Body",         fontSize=9.5, textColor=DARK_BG, spaceAfter=5,  fontName="Helvetica",       leading=14)
body_sm       = S("BodySm",       fontSize=8.5, textColor=DK_GREY, spaceAfter=3,  fontName="Helvetica",       leading=12)
bullet        = S("Bullet",       fontSize=9.5, textColor=DARK_BG, spaceAfter=3,  fontName="Helvetica",       leading=14, leftIndent=12, bulletIndent=0)
table_head    = S("TableHead",    fontSize=9,  textColor=WHITE,    fontName="Helvetica-Bold", alignment=TA_CENTER)
table_cell    = S("TableCell",    fontSize=8.5, textColor=DARK_BG, fontName="Helvetica",      alignment=TA_CENTER, leading=11)
table_label   = S("TableLabel",   fontSize=8.5, textColor=DARK_BG, fontName="Helvetica-Bold", alignment=TA_LEFT,   leading=11)
note_style    = S("Note",         fontSize=8,  textColor=DK_GREY,  fontName="Helvetica-Oblique", spaceAfter=4)
caption       = S("Caption",      fontSize=9,  textColor=DK_GREY,  fontName="Helvetica-Bold",    spaceBefore=10, spaceAfter=2)

# ── Helpers ───────────────────────────────────────────────────────────────────
def tick():  return Paragraph("<font color='#4CAF50'>&#10003;</font>", table_cell)
def cross(): return Paragraph("<font color='#E53935'>&#10007;</font>", table_cell)
def partial(txt): return Paragraph(f"<font color='#F59E0B'>{txt}</font>", table_cell)
def hdr(txt): return Paragraph(txt, table_head)
def cell(txt): return Paragraph(txt, table_cell)
def lbl(txt): return Paragraph(txt, table_label)

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

TIER_STYLE_BASE = [
    ("BACKGROUND",  (0, 0), (-1, 0), DARK_BG),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ("GRID",        (0, 0), (-1, -1), 0.4, MID_GREY),
    ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING",  (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING",(0, 0), (-1, -1), 6),
]

def section_rule():
    return HRFlowable(width="100%", thickness=1, color=MID_GREY, spaceAfter=4, spaceBefore=4)

# ── Document ──────────────────────────────────────────────────────────────────
doc = TOCDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm,
    topMargin=15*mm, bottomMargin=15*mm,
    title="YT Transcriber — Clerk Integration Proposal",
    author="YT Transcriber"
)

W = A4[0] - 36*mm

story = []

# ── Cover ─────────────────────────────────────────────────────────────────────
logo_w = W * 0.58
logo_img = Image(LOGO_PATH, width=logo_w, height=logo_w / 5)

cover_table = Table(
    [[logo_img, Paragraph("INTERNAL", S("IT", fontSize=8, textColor=MID_GREY, fontName="Helvetica", alignment=TA_RIGHT))]],
    colWidths=[W * 0.75, W * 0.25]
)
cover_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), DARK_BG),
    ("TOPPADDING",  (0, 0), (-1, -1), 14),
    ("BOTTOMPADDING",(0, 0), (-1, -1), 14),
    ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ("RIGHTPADDING",(0, 0), (-1, -1), 14),
    ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
]))
story.append(cover_table)

cover_body = Table([[
    Paragraph("Clerk Integration &amp; Subscription Tier Proposal", S("CS", fontSize=18, textColor=WHITE, fontName="Helvetica-Bold")),
    Paragraph(f"Date: {date.today().strftime('%d %B %Y')}", S("CD", fontSize=9, textColor=MID_GREY, fontName="Helvetica", alignment=TA_RIGHT))
]], colWidths=[W * 0.72, W * 0.28])
cover_body.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), DARK_BG),
    ("TOPPADDING",  (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING",(0, 0), (-1, -1), 20),
    ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ("RIGHTPADDING",(0, 0), (-1, -1), 14),
    ("VALIGN",      (0, 0), (-1, -1), "BOTTOM"),
]))
story.append(cover_body)
story.append(Spacer(1, 10))

# ── Table of Contents ─────────────────────────────────────────────────────────
story.append(Paragraph("Contents", h1))
story.append(section_rule())
story.append(build_toc())
story.append(PageBreak())

# ── Section 1: Why Clerk ──────────────────────────────────────────────────────
story.append(Paragraph("1. Why Clerk?", h1))
story.append(section_rule())
story.append(Paragraph(
    "Clerk is a hosted authentication and billing platform. Rather than integrating two separate SaaS tools "
    "(e.g. Auth0 + Stripe directly), Clerk handles both auth and subscription management in a single service, "
    "with Stripe connected under the hood. This reduces the number of external dependencies, webhooks, and "
    "synchronisation code needed to run the platform.",
    body))

story.append(Paragraph("What Clerk manages for us:", h2))
info_rows = [
    ["&#10003;", "User authentication (email/password, social login, MFA)"],
    ["&#10003;", "Session management and JWT tokens"],
    ["&#10003;", "Subscription plans — free trial, paid tiers"],
    ["&#10003;", "Free trial logic (one-time per user, card required upfront)"],
    ["&#10003;", "Plan upgrades, downgrades and cancellations"],
    ["&#10003;", "Pre-built billing portal — users self-manage their plan"],
    ["&#10003;", "Feature gating (server-side plan checks via has() helper)"],
    ["&#10003;", "Stripe connection — Clerk syncs users and payments automatically"],
]
info_data = [[Paragraph(r[0], S("tk", fontSize=10, textColor=GREEN, fontName="Helvetica-Bold", alignment=TA_CENTER)),
               Paragraph(r[1], body_sm)] for r in info_rows]
info_t = Table(info_data, colWidths=[12*mm, W - 12*mm])
info_t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3)]))
story.append(info_t)
story.append(Spacer(1, 6))

story.append(Paragraph("What our app still manages:", h2))
app_rows = [
    ["!", "Video credit counter (how many videos used this month)"],
    ["!", "Credit rollover logic (unused credits carry forward up to 1 month)"],
    ["!", "Per-video processing, transcript storage and output files"],
    ["!", "Collections, folders, share links and other product features"],
]
app_data = [[Paragraph(r[0], S("tk2", fontSize=10, textColor=AMBER, fontName="Helvetica-Bold", alignment=TA_CENTER)),
              Paragraph(r[1], body_sm)] for r in app_rows]
app_t = Table(app_data, colWidths=[12*mm, W - 12*mm])
app_t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3)]))
story.append(app_t)
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Note: Clerk does not natively support usage-based credit counters. The credits system (rolling monthly "
    "allowance) will be a lightweight custom layer in our database, checked against the user's active Clerk plan.",
    note_style))

# ── Section 2: Free Trial ─────────────────────────────────────────────────────
story.append(PageBreak())
story.append(Paragraph("2. Free Trial Setup", h1))
story.append(section_rule())
story.append(Paragraph(
    "Clerk has native free trial support. The following rules apply regardless of which tier model is chosen:",
    body))

trial_items = [
    "<b>One-time only</b> — a user who has previously paid or used a trial cannot start another.",
    "<b>Card required upfront</b> — reduces abuse; Clerk enforces this automatically.",
    "<b>Trial period</b> — proposed: allow 3 full video transcriptions.",
    "<b>Auto-conversion</b> — at trial end, Clerk charges the card and moves the user to the paid plan seamlessly.",
    "<b>Trial extension</b> — can be extended manually (1-365 days) from the Clerk dashboard if needed.",
    "<b>Feature visibility</b> — while on trial, the user sees all features of the paid tier they trialled. "
     "This creates the upgrade hook — they experience the product fully before deciding to continue.",
]
for item in trial_items:
    story.append(Paragraph(f"&#8226;  {item}", bullet))

story.append(Spacer(1, 6))
story.append(Paragraph("Proposed trial configuration:", h2))
trial_t = Table([
    [hdr("Setting"), hdr("Value"), hdr("Rationale")],
    [lbl("Trial videos"),          cell("3 videos"),             cell("Enough to see real value; not enough to misuse for free")],
    [lbl("Card required"),         cell("Yes"),                  cell("Deters abuse; enables seamless conversion")],
    [lbl("Trial tier"),            cell("Pro-tier features"),    cell("Users experience the best version of the product")],
    [lbl("Post-trial default"),    cell("Auto-charge paid plan"),cell("Reduces churn from forgetting to upgrade")],
    [lbl("Credit rollover on trial"), cell("No — trial credits expire"), cell("Keeps trial clean and separate from paid")],
], colWidths=[W * 0.3, W * 0.25, W * 0.45])
trial_t.setStyle(TableStyle(TIER_STYLE_BASE + [
    ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#2A2A2A")),
    ("TEXTCOLOR",  (0, 1), (-1, 1), WHITE),
]))
story.append(trial_t)

# ── Section 3: Tier Models ────────────────────────────────────────────────────
story.append(PageBreak())
story.append(Paragraph("3. Tier Model Options", h1))
story.append(section_rule())
story.append(Paragraph(
    "Four different tier model proposals are presented below. Each follows the same principle: the free trial "
    "gives access to Pro-tier features for 3 videos, then the user chooses a plan. None of these are final — "
    "they are starting points for review and discussion.",
    body))
story.append(Spacer(1, 6))

story.append(Paragraph("Feature key used in tables below:", caption))
key_data = [[
    Paragraph("&#10003;", S("gn", fontSize=10, textColor=GREEN, fontName="Helvetica-Bold", alignment=TA_CENTER)),
    Paragraph("Included", body_sm),
    Paragraph("&#10007;", S("rd", fontSize=10, textColor=RED, fontName="Helvetica-Bold", alignment=TA_CENTER)),
    Paragraph("Not included", body_sm),
    Paragraph("~", S("am", fontSize=10, textColor=AMBER, fontName="Helvetica-Bold", alignment=TA_CENTER)),
    Paragraph("Limited / partial", body_sm),
]]
key_t = Table(key_data, colWidths=[8*mm, 28*mm, 8*mm, 30*mm, 8*mm, 30*mm])
key_t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),2),("BOTTOMPADDING",(0,0),(-1,-1),2)]))
story.append(key_t)
story.append(Spacer(1, 10))

cw5 = [W*0.30, W*0.175, W*0.175, W*0.175, W*0.175]
cw4 = [W*0.37, W*0.21, W*0.21, W*0.21]

# Model A
story.append(KeepTogether([
    Paragraph("Model A — Classic Three-Tier + Unlimited", h2),
    Paragraph(
        "A familiar SaaS structure. Low entry price to capture casual users, mid tier for regular use, "
        "unlimited for power users. The Basic tier is intentionally lean to push users toward Pro.",
        note_style),
]))
A_rows = [
    [lbl("Monthly video credits"),   cell("3 (trial only)"), cell("10 vids/mo"), cell("40 vids/mo"), cell("Unlimited")],
    [lbl("Credit rollover"),         cross(),                partial("7 days"),  partial("30 days"), tick()],
    [lbl("Transcript viewer"),       tick(), tick(), tick(), tick()],
    [lbl("Timestamped sentences"),   tick(), tick(), tick(), tick()],
    [lbl("Screenshots of URLs"),     tick(), cross(), tick(), tick()],
    [lbl("ZIP export"),              tick(), cross(), tick(), tick()],
    [lbl("Notes panel"),             tick(), tick(), tick(), tick()],
    [lbl("Transcript search"),       tick(), cross(), tick(), tick()],
    [lbl("Collections / folders"),   cross(), cross(), tick(), tick()],
    [lbl("Share links"),             cross(), cross(), tick(), tick()],
    [lbl("AI chapter markers"),      tick(), cross(), cross(), tick()],
    [lbl("Scheduled transcription"), cross(), cross(), cross(), tick()],
    [lbl("Transcript correction"),   cross(), cross(), tick(), tick()],
    [lbl("Priority processing"),     cross(), cross(), cross(), tick()],
]
A_t = Table([[hdr(h) for h in ["Feature", "Starter  (Free Trial)", "Basic  £5/mo", "Pro  £14/mo", "Unlimited  £29/mo"]]] + A_rows, colWidths=cw5)
A_t.setStyle(TableStyle(TIER_STYLE_BASE))
story.append(A_t)
story.append(Paragraph("Upgrade hooks: Screenshots and ZIP locked behind Pro. AI chapters reserved for Unlimited. Basic is intentionally thin.", note_style))
story.append(PageBreak())

# Model B
story.append(KeepTogether([
    Paragraph("Model B — Generous Free Tier, Fewer Paid Tiers", h2),
    Paragraph(
        "A permanent free tier (not just a trial) drives organic word-of-mouth growth. Only two paid tiers "
        "simplifies the decision. The free tier is genuinely useful but clearly limited on volume.",
        note_style),
]))
B_rows = [
    [lbl("Monthly video credits"),   cell("3 vids/mo forever"), cell("25 vids/mo"), cell("Unlimited")],
    [lbl("Credit rollover"),         cross(),                   partial("14 days"), tick()],
    [lbl("Transcript viewer"),       tick(), tick(), tick()],
    [lbl("Timestamped sentences"),   tick(), tick(), tick()],
    [lbl("Screenshots of URLs"),     cross(), tick(), tick()],
    [lbl("ZIP export"),              cross(), tick(), tick()],
    [lbl("Notes panel"),             tick(), tick(), tick()],
    [lbl("Transcript search"),       cross(), tick(), tick()],
    [lbl("Collections / folders"),   cross(), partial("5 max"), tick()],
    [lbl("Share links"),             cross(), tick(), tick()],
    [lbl("AI chapter markers"),      cross(), partial("5/mo"), tick()],
    [lbl("Scheduled transcription"), cross(), cross(), tick()],
    [lbl("Transcript correction"),   cross(), tick(), tick()],
    [lbl("Priority processing"),     cross(), cross(), tick()],
]
B_t = Table([[hdr(h) for h in ["Feature", "Free  (Permanent)", "Creator  £9/mo", "Pro  £22/mo"]]] + B_rows, colWidths=cw4)
B_t.setStyle(TableStyle(TIER_STYLE_BASE))
story.append(B_t)
story.append(Paragraph("Upgrade hooks: Free locks screenshots, ZIP and search. Creator caps collections and AI chapters.", note_style))
story.append(PageBreak())

# Model C
story.append(KeepTogether([
    Paragraph("Model C — Identity-Led Naming (Explorer / Creator / Studio / Enterprise)", h2),
    Paragraph(
        "Names reflect the user's role, not just a price band. Explorer feels non-threatening for new users. "
        "Studio signals professional use. Enterprise is future-ready for team accounts.",
        note_style),
]))
C_rows = [
    [lbl("Monthly video credits"),   cell("3 (trial)"),   cell("15 vids/mo"),       cell("60 vids/mo"),          cell("Unlimited")],
    [lbl("Credit rollover"),         cross(),             partial("7 days"),         partial("30 days"),          tick()],
    [lbl("Transcript viewer"),       tick(), tick(), tick(), tick()],
    [lbl("Timestamped sentences"),   tick(), tick(), tick(), tick()],
    [lbl("Screenshots of URLs"),     tick(), cross(), tick(), tick()],
    [lbl("ZIP export"),              tick(), partial("No screenshots"), tick(),      tick()],
    [lbl("Notes panel"),             tick(), tick(), tick(), tick()],
    [lbl("Transcript search"),       tick(), cross(), tick(), tick()],
    [lbl("Collections / folders"),   cross(), cross(), tick(), tick()],
    [lbl("Share links"),             cross(), cross(), tick(), tick()],
    [lbl("AI chapter markers"),      tick(), cross(), tick(), tick()],
    [lbl("Scheduled transcription"), cross(), cross(), partial("3 channels"), tick()],
    [lbl("Transcript correction"),   cross(), tick(), tick(), tick()],
    [lbl("Team workspace"),          cross(), cross(), cross(), tick()],
    [lbl("Priority processing"),     cross(), cross(), cross(), tick()],
]
C_t = Table([[hdr(h) for h in ["Feature", "Explorer  (Trial)", "Creator  £7/mo", "Studio  £19/mo", "Enterprise  £45/mo"]]] + C_rows, colWidths=cw5)
C_t.setStyle(TableStyle(TIER_STYLE_BASE))
story.append(C_t)
story.append(Paragraph(
    "Upgrade hooks: Creator feels cut-down (no screenshots in ZIP, no search). Studio is the intended sweet spot. "
    "Enterprise adds team features for future B2B expansion without needing to build it now.",
    note_style))
story.append(PageBreak())

# Model D
story.append(KeepTogether([
    Paragraph("Model D — Base Plans + Credit Top-Up Packs", h2),
    Paragraph(
        "Lower base subscription cost; users buy extra credit packs if they exceed their allowance. "
        "Reduces churn from occasional heavy users. Note: top-ups require a small amount of custom Stripe work alongside Clerk.",
        note_style),
]))
D_rows = [
    [lbl("Monthly video credits"),   cell("3 (trial)"), cell("8 vids/mo"),  cell("35 vids/mo"),        cell("Unlimited")],
    [lbl("Extra credit top-ups"),    cross(),           cell("+5 for £2"),  cell("+10 for £3"),         cell("N/A")],
    [lbl("Credit rollover"),         cross(),           partial("7 days"),  partial("30 days"),         tick()],
    [lbl("Transcript viewer"),       tick(), tick(), tick(), tick()],
    [lbl("Timestamped sentences"),   tick(), tick(), tick(), tick()],
    [lbl("Screenshots of URLs"),     tick(), cross(), tick(), tick()],
    [lbl("ZIP export"),              tick(), tick(), tick(), tick()],
    [lbl("Notes panel"),             tick(), tick(), tick(), tick()],
    [lbl("Transcript search"),       tick(), cross(), tick(), tick()],
    [lbl("Collections / folders"),   cross(), cross(), tick(), tick()],
    [lbl("Share links"),             cross(), cross(), tick(), tick()],
    [lbl("AI chapter markers"),      tick(), cross(), partial("5/mo"), tick()],
    [lbl("Scheduled transcription"), cross(), cross(), cross(), tick()],
    [lbl("Transcript correction"),   cross(), tick(), tick(), tick()],
    [lbl("Priority processing"),     cross(), cross(), cross(), tick()],
]
D_t = Table([[hdr(h) for h in ["Feature", "Free Trial", "Lite  £6/mo", "Regular  £15/mo", "Power  £35/mo"]]] + D_rows, colWidths=cw5)
D_t.setStyle(TableStyle(TIER_STYLE_BASE))
story.append(D_t)
story.append(Paragraph(
    "Upgrade hooks: Lite locks screenshots and search. Credit top-ups give a pressure valve — "
    "casual users stay on Lite with occasional extras; heavy users naturally migrate to Regular.",
    note_style))

# ── Section 4: Comparison ─────────────────────────────────────────────────────
story.append(PageBreak())
story.append(Paragraph("4. Model Comparison at a Glance", h1))
story.append(section_rule())

comp_rows = [
    [lbl("Tier count"),             cell("4"),            cell("3"),          cell("4"),              cell("4")],
    [lbl("Permanent free tier"),    cross(),              tick(),             cross(),                cross()],
    [lbl("Credit top-ups"),         cross(),              cross(),            cross(),                tick()],
    [lbl("Lowest paid price"),      cell("£5/mo"),        cell("£9/mo"),      cell("£7/mo"),          cell("£6/mo")],
    [lbl("Mid tier price"),         cell("£14/mo"),       cell("£22/mo"),     cell("£19/mo"),         cell("£15/mo")],
    [lbl("Top tier price"),         cell("£29/mo"),       cell("N/A"),        cell("£45/mo"),         cell("£35/mo")],
    [lbl("Team / B2B ready"),       cross(),              cross(),            tick(),                 cross()],
    [lbl("Simplest for user"),      partial("Medium"),    tick(),             partial("Medium"),      partial("Complex")],
    [lbl("Revenue potential"),      partial("Medium"),    partial("Medium"),  tick(),                 tick()],
    [lbl("Best fit for"),           cell("Standard SaaS"),cell("Growth-led"), cell("Pro brand"),      cell("Power users")],
]
comp_t = Table(
    [[hdr(h) for h in ["", "Model A", "Model B", "Model C", "Model D"]]] + comp_rows,
    colWidths=[W*0.28, W*0.18, W*0.18, W*0.18, W*0.18]
)
comp_t.setStyle(TableStyle(TIER_STYLE_BASE))
story.append(comp_t)

story.append(Spacer(1, 12))
story.append(Paragraph("5. Recommended Starting Point", h1))

story.append(section_rule())
story.append(Paragraph(
    "Based on the goal of driving upgrades while keeping the product accessible, "
    "<b>Model C (Explorer / Creator / Studio / Enterprise)</b> is the strongest starting point. "
    "The naming is aspirational and positions the product as a professional tool. "
    "The Studio tier (£19/mo) is the intended landing zone for most paying users — "
    "it includes all core features and is priced to feel fair against the value delivered. "
    "Enterprise is a placeholder for future team/B2B expansion and does not need to be built immediately.",
    body))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "If a permanent free tier is preferred to drive organic growth, <b>Model B</b> is the "
    "simplest and cleanest option — two paid tiers reduces decision fatigue for the user.",
    body))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "All prices shown are indicative in GBP and are not final. Review and adjust based on "
    "competitive research and target audience before launch.",
    note_style))


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 6 — COST & REVENUE BREAKDOWN
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("6. Cost &amp; Revenue Breakdown", h1))
story.append(section_rule())
story.append(Paragraph(
    "The tables below show projected monthly income, costs, and profit for each tier model at "
    "different paying subscriber counts. All figures are in GBP. Assumptions are listed below.",
    body))

story.append(Paragraph("Cost assumptions:", h2))
assump_rows = [
    ["Server / hosting",      "£25/mo fixed",    "Covers up to ~500 users. Add £25/mo per additional 500."],
    ["Clerk platform",        "£0/mo",           "Free up to 50,000 MAU. Paid plan only needed at scale."],
    ["Payment processing",    "~2.1% of revenue","Clerk 0.7% + Stripe ~1.4% transaction fees."],
    ["AI chapter markers",    "£0.01/use (Haiku)","Assumed 30% of users run AI chapters on avg 5 videos/mo."],
    ["Storage / bandwidth",   "~£0.002/user/mo", "Negligible at early scale."],
    ["Total variable / user", "~£0.05/user/mo",  "Blended average across all tiers and feature usage."],
]
assump_t = Table(
    [[hdr("Item"), hdr("Rate"), hdr("Notes")]] +
    [[lbl(r[0]), cell(r[1]), Paragraph(r[2], body_sm)] for r in assump_rows],
    colWidths=[W*0.28, W*0.22, W*0.50]
)
assump_t.setStyle(TableStyle(TIER_STYLE_BASE))
story.append(assump_t)
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Tier mix assumption: 20% on lowest paid tier, 55% on mid tier, 25% on top tier. "
    "This gives the blended ARPU (average revenue per user) used in projections below.",
    note_style))

USER_COUNTS = [5, 10, 25, 50, 100, 250, 500, 1000]
FIXED_BASE  = 25.0   # £/mo server
VAR_PER_USR = 0.05   # £/mo variable cost per user
PAY_FEE_PCT = 0.021  # 2.1% payment processing

def server_cost(users):
    # Add £25 per 500 users above first 500
    return FIXED_BASE + max(0, ((users - 1) // 500)) * 25.0

def revenue_breakdown(users, arpu):
    rev   = users * arpu
    fixed = server_cost(users)
    var   = users * VAR_PER_USR
    fees  = rev * PAY_FEE_PCT
    total_cost = fixed + var + fees
    profit = rev - total_cost
    margin = (profit / rev * 100) if rev > 0 else 0
    return rev, fixed, var, fees, total_cost, profit, margin

# ── ARPU per model (blended) ──────────────────────────────────────────────────
# Model A: Basic £5 (20%), Pro £14 (55%), Unlimited £29 (25%)
ARPU_A = 0.20*5 + 0.55*14 + 0.25*29
# Model B: Creator £9 (40%), Pro £22 (60%)
ARPU_B = 0.40*9 + 0.60*22
# Model C: Creator £7 (20%), Studio £19 (55%), Enterprise £45 (25%)
ARPU_C = 0.20*7 + 0.55*19 + 0.25*45
# Model D: Lite £6 (20%), Regular £15 (55%), Power £35 (25%)
ARPU_D = 0.20*6 + 0.55*15 + 0.25*35

models_arpu = [
    ("Model A", ARPU_A, "Basic £5 / Pro £14 / Unlimited £29"),
    ("Model B", ARPU_B, "Creator £9 / Pro £22"),
    ("Model C", ARPU_C, "Creator £7 / Studio £19 / Enterprise £45"),
    ("Model D", ARPU_D, "Lite £6 / Regular £15 / Power £35"),
]

fin_head = S("FinH", fontSize=9, textColor=WHITE, fontName="Helvetica-Bold", alignment=TA_CENTER)
fin_cell = S("FinC", fontSize=8, textColor=DARK_BG, fontName="Helvetica", alignment=TA_RIGHT, leading=11)
fin_lbl  = S("FinL", fontSize=8, textColor=DARK_BG, fontName="Helvetica-Bold", alignment=TA_LEFT, leading=11)
fin_grn  = S("FinG", fontSize=8, textColor=GREEN,   fontName="Helvetica-Bold", alignment=TA_RIGHT, leading=11)
fin_red  = S("FinR", fontSize=8, textColor=RED,      fontName="Helvetica-Bold", alignment=TA_RIGHT, leading=11)
fin_amb  = S("FinA", fontSize=8, textColor=AMBER,    fontName="Helvetica-Bold", alignment=TA_RIGHT, leading=11)

def profit_style(val):
    if val >= 100:  return fin_grn
    if val >= 0:    return fin_amb
    return fin_red

def pct_style(val):
    if val >= 50:   return fin_grn
    if val >= 20:   return fin_amb
    return fin_red

FIN_COL = [W*0.14] + [W*0.086]*8  # label + 8 user counts

for model_name, arpu, tier_desc in models_arpu:
    story.append(Spacer(1, 14))
    story.append(Paragraph(f"{model_name} — Blended ARPU: £{arpu:.2f}/mo", h2))
    story.append(Paragraph(f"Tier mix: {tier_desc}", note_style))

    hdr_row = [Paragraph("", fin_head)] + [Paragraph(f"{u} users", fin_head) for u in USER_COUNTS]

    rows_data = []
    revs, costs, profits, margins = [], [], [], []
    for u in USER_COUNTS:
        rev, fixed, var, fees, tc, profit, margin = revenue_breakdown(u, arpu)
        revs.append(rev); costs.append(tc); profits.append(profit); margins.append(margin)

    rows_data.append([Paragraph("Monthly income", fin_lbl)] +
                     [Paragraph(f"£{r:,.0f}", fin_cell) for r in revs])
    rows_data.append([Paragraph("  Server cost", fin_lbl)] +
                     [Paragraph(f"£{server_cost(u):,.0f}", fin_cell) for u in USER_COUNTS])
    rows_data.append([Paragraph("  Variable cost", fin_lbl)] +
                     [Paragraph(f"£{u*VAR_PER_USR:,.2f}", fin_cell) for u in USER_COUNTS])
    rows_data.append([Paragraph("  Payment fees", fin_lbl)] +
                     [Paragraph(f"£{revenue_breakdown(u,arpu)[3]:,.2f}", fin_cell) for u in USER_COUNTS])
    rows_data.append([Paragraph("Total costs", fin_lbl)] +
                     [Paragraph(f"£{c:,.0f}", fin_cell) for c in costs])
    rows_data.append([Paragraph("Net profit", fin_lbl)] +
                     [Paragraph(f"£{p:,.0f}", profit_style(p)) for p in profits])
    rows_data.append([Paragraph("Margin %", fin_lbl)] +
                     [Paragraph(f"{m:.0f}%", pct_style(m)) for m in margins])

    fin_t = Table([hdr_row] + rows_data, colWidths=FIN_COL)
    fin_style = TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), DARK_BG),
        ("BACKGROUND",   (0, 1), (-1, 1), colors.HexColor("#F0F8FF")),  # income row highlight
        ("BACKGROUND",   (0, 5), (-1, 5), colors.HexColor("#F5F5F5")),  # total costs
        ("BACKGROUND",   (0, 6), (-1, 6), colors.HexColor("#FFFDE7")),  # profit
        ("BACKGROUND",   (0, 7), (-1, 7), colors.HexColor("#F1F8E9")),  # margin
        ("ROWBACKGROUNDS",(0, 2), (-1, 4), [WHITE, LIGHT_BG, WHITE]),
        ("GRID",         (0, 0), (-1, -1), 0.4, MID_GREY),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW",    (0, 1), (-1, 1), 0.8, MID_GREY),
        ("LINEBELOW",    (0, 5), (-1, 5), 0.8, MID_GREY),
    ])
    fin_t.setStyle(fin_style)
    story.append(fin_t)

# ── Break-even callout ────────────────────────────────────────────────────────
story.append(Spacer(1, 14))
story.append(Paragraph("Break-even summary:", h2))

be_rows = []
for model_name, arpu, _ in models_arpu:
    # Find minimum users to break even (profit >= 0)
    for u in range(1, 2000):
        _, _, _, _, tc, profit, _ = revenue_breakdown(u, arpu)
        if profit >= 0:
            be_rows.append([lbl(model_name), cell(f"{u} paying users"), cell(f"£{u*arpu:,.2f}/mo revenue"), cell(f"£{tc:,.2f}/mo costs")])
            break

be_t = Table(
    [[hdr("Model"), hdr("Break-even point"), hdr("Revenue at break-even"), hdr("Costs at break-even")]] + be_rows,
    colWidths=[W*0.20, W*0.25, W*0.28, W*0.27]
)
be_t.setStyle(TableStyle(TIER_STYLE_BASE))
story.append(be_t)
story.append(Spacer(1, 4))
story.append(Paragraph(
    "These figures assume the tier mix and variable cost estimates above. Actual break-even will vary based "
    "on real usage patterns, AI chapter adoption rate, and final hosting configuration.",
    note_style))

story.append(Spacer(1, 16))
story.append(HRFlowable(width="100%", thickness=0.5, color=MID_GREY))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "YT Transcriber — Internal Planning Document — Not for Distribution",
    S("Footer", fontSize=7.5, textColor=MID_GREY, fontName="Helvetica", alignment=TA_CENTER)))

doc.multiBuild(story)
print(f"PDF saved to {OUTPUT}")
