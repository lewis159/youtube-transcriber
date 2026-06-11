from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import date

LOGO_PATH = r"Z:\GIT\Cursor\new project\youtube-transcriber\business plan\static\logo_full@2x.jpg"

OUTPUT = r"Z:\GIT\Cursor\new project\youtube-transcriber\business plan\YT_Transcriber_Business_Plan.pdf"

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
RED_SOFT = colors.HexColor("#FFEBEE")
GRN_SOFT = colors.HexColor("#F1F8E9")
AMB_SOFT = colors.HexColor("#FFFDE7")

def S(name, **kw):
    return ParagraphStyle(name, **kw)

h1       = S("H1",    fontSize=18, textColor=DARK_BG,  spaceBefore=14, spaceAfter=6,  fontName="Helvetica-Bold")
h2       = S("H2",    fontSize=13, textColor=RED,      spaceBefore=10, spaceAfter=4,  fontName="Helvetica-Bold")
h3       = S("H3",    fontSize=10, textColor=DARK_BG,  spaceBefore=7,  spaceAfter=3,  fontName="Helvetica-Bold")
body     = S("Body",  fontSize=9.5, textColor=DARK_BG, spaceAfter=5,   fontName="Helvetica", leading=14)
body_sm  = S("BSm",   fontSize=8.5, textColor=DK_GREY, spaceAfter=3,   fontName="Helvetica", leading=12)
bullet   = S("Bul",   fontSize=9.5, textColor=DARK_BG, spaceAfter=3,   fontName="Helvetica", leading=14, leftIndent=14)
note     = S("Note",  fontSize=8,   textColor=DK_GREY, spaceAfter=4,   fontName="Helvetica-Oblique")
tbl_head = S("TH",    fontSize=9,   textColor=WHITE,   fontName="Helvetica-Bold", alignment=TA_CENTER)
tbl_cell = S("TC",    fontSize=8.5, textColor=DARK_BG, fontName="Helvetica",      alignment=TA_CENTER, leading=11)
tbl_lbl  = S("TL",    fontSize=8.5, textColor=DARK_BG, fontName="Helvetica-Bold", alignment=TA_LEFT,   leading=11)
tbl_sm   = S("TS",    fontSize=8,   textColor=DK_GREY, fontName="Helvetica",      alignment=TA_LEFT,   leading=11)
status_g = S("SG",    fontSize=8.5, textColor=GREEN,   fontName="Helvetica-Bold", alignment=TA_CENTER)
status_r = S("SR",    fontSize=8.5, textColor=RED,     fontName="Helvetica-Bold", alignment=TA_CENTER)
status_a = S("SA",    fontSize=8.5, textColor=AMBER,   fontName="Helvetica-Bold", alignment=TA_CENTER)

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

def hdr(t): return Paragraph(t, tbl_head)
def cell(t): return Paragraph(t, tbl_cell)
def lbl(t):  return Paragraph(t, tbl_lbl)
def sm(t):   return Paragraph(t, tbl_sm)
def tick():  return Paragraph("<font color='#4CAF50'>&#10003;</font>", tbl_cell)
def cross(): return Paragraph("<font color='#E53935'>&#10007;</font>", tbl_cell)
def rule():  return HRFlowable(width="100%", thickness=1, color=MID_GREY, spaceAfter=4, spaceBefore=4)
def chk(done=False):
    return Paragraph("&#9745;" if done else "&#9744;", S("ck", fontSize=10, textColor=DARK_BG, fontName="Helvetica", alignment=TA_CENTER))

doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm,
    topMargin=15*mm,  bottomMargin=15*mm,
    title="YT Transcriber — Business Plan",
    author="YT Transcriber"
)
W = A4[0] - 36*mm
story = []

# ══════════════════════════════════════════════════════════════════════════════
#  COVER
# ══════════════════════════════════════════════════════════════════════════════
import os
# logo_full@2x is 1200x240 — aspect ratio 5:1
logo_w = W * 0.58
logo_h = logo_w / 5
logo_img = Image(LOGO_PATH, width=logo_w, height=logo_h)

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
    Paragraph("Business Plan — UK Edition", S("CS", fontSize=18, textColor=WHITE, fontName="Helvetica-Bold")),
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

# ══════════════════════════════════════════════════════════════════════════════
#  1. EXECUTIVE SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("1. Executive Summary", h1))
story.append(rule())
story.append(Paragraph(
    "YT Transcriber is a UK-based SaaS web application that automatically fetches transcripts from YouTube videos, "
    "groups them into timestamped sentences, captures screenshots of any URLs mentioned, and exports everything "
    "as a structured Word document and ZIP archive. It is aimed at content creators, researchers, students, "
    "journalists, and productivity-focused professionals who regularly consume and reference YouTube content.",
    body))
story.append(Paragraph(
    "The service will operate on a subscription model via Clerk (auth + billing) and Stripe (payments), "
    "with a free trial of 3 videos followed by paid monthly tiers. The business will be registered as a "
    "UK Limited Company, fully compliant with UK GDPR, ICO requirements, and HMRC tax obligations.",
    body))

summary_rows = [
    ["Business name",      "YT Transcriber Ltd (proposed)"],
    ["Business type",      "UK Private Limited Company (Ltd)"],
    ["Business model",     "B2C SaaS — monthly subscription + free trial"],
    ["Target market",      "Content creators, researchers, students, journalists"],
    ["Primary revenue",    "Subscription tiers (£7–£45/mo)"],
    ["Launch approach",    "Soft launch / public beta via website"],
    ["Break-even est.",    "~2 paying subscribers (low fixed costs)"],
    ["Year 1 target",      "100 paying subscribers"],
]
st = Table([[lbl(r[0]), cell(r[1])] for r in summary_rows], colWidths=[W*0.38, W*0.62])
st.setStyle(TableStyle([
    ("ROWBACKGROUNDS", (0,0),(-1,-1), [WHITE, LIGHT_BG]),
    ("GRID",          (0,0),(-1,-1), 0.4, MID_GREY),
    ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
    ("TOPPADDING",    (0,0),(-1,-1), 5),
    ("BOTTOMPADDING", (0,0),(-1,-1), 5),
    ("LEFTPADDING",   (0,0),(-1,-1), 6),
    ("RIGHTPADDING",  (0,0),(-1,-1), 6),
]))
story.append(st)

# ══════════════════════════════════════════════════════════════════════════════
#  2. BUSINESS STRUCTURE
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("2. Business Structure", h1))
story.append(rule())

story.append(Paragraph("Recommended structure: UK Private Limited Company (Ltd)", h2))
story.append(Paragraph(
    "A Ltd company is recommended over sole trader for a SaaS product. It limits personal liability, "
    "is more credible to customers and payment processors, and is more tax-efficient once profits grow.",
    body))

struct_rows = [
    ["Register at Companies House",  "£50 one-off online",        "Takes ~24 hours. Required before opening business bank account."],
    ["Registered UK address",        "~£5–15/mo",                 "Virtual office address keeps your home address off the public register."],
    ["Business bank account",        "Free – £10/mo",             "Tide, Monzo Business, or Starling. Required for Ltd company."],
    ["Accountant",                   "~£50–150/mo",               "Not legally required but strongly recommended for Ltd companies."],
    ["Bookkeeping software",         "~£12–30/mo",                "Xero, FreeAgent, or QuickBooks. Required for Making Tax Digital (MTD)."],
]
st2 = Table(
    [[hdr("Item"), hdr("Est. Cost"), hdr("Notes")]] +
    [[lbl(r[0]), cell(r[1]), sm(r[2])] for r in struct_rows],
    colWidths=[W*0.30, W*0.20, W*0.50]
)
st2.setStyle(TableStyle(BASE_STYLE))
story.append(st2)

# ══════════════════════════════════════════════════════════════════════════════
#  3. UK TAX & FINANCE
# ══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 10))
story.append(Paragraph("3. UK Tax &amp; Finance", h1))
story.append(rule())

story.append(Paragraph("Corporation Tax", h2))
story.append(Paragraph(
    "As a Ltd company, YT Transcriber will pay Corporation Tax on profits. "
    "Rates as of 2024/25:", body))
ct_rows = [
    ["Up to £50,000 profit",           "19%",  "Small profits rate"],
    ["£50,001 – £250,000 profit",      "Marginal relief", "Tapered between 19% and 25%"],
    ["Over £250,000 profit",           "25%",  "Main rate"],
]
ct = Table(
    [[hdr("Profit band"), hdr("Rate"), hdr("Notes")]] +
    [[lbl(r[0]), cell(r[1]), sm(r[2])] for r in ct_rows],
    colWidths=[W*0.38, W*0.18, W*0.44]
)
ct.setStyle(TableStyle(BASE_STYLE))
story.append(ct)
story.append(Spacer(1, 8))

story.append(Paragraph("VAT", h2))
vat_rows = [
    ["Registration threshold",    "£90,000/year turnover",   "Mandatory registration above this. Voluntary registration below it is possible."],
    ["Standard rate",             "20%",                     "Applies to UK B2C digital subscription sales."],
    ["Digital services — EU",     "Local VAT rates",         "Post-Brexit: must register for VAT OSS or in each EU country if selling to EU consumers."],
    ["VAT returns",               "Quarterly",               "Submitted digitally via Making Tax Digital (MTD) compatible software."],
]
vt = Table(
    [[hdr("Item"), hdr("Rate / Threshold"), hdr("Notes")]] +
    [[lbl(r[0]), cell(r[1]), sm(r[2])] for r in vat_rows],
    colWidths=[W*0.28, W*0.24, W*0.48]
)
vt.setStyle(TableStyle(BASE_STYLE))
story.append(vt)
story.append(Spacer(1, 8))

story.append(Paragraph("Other Financial Obligations", h2))
fin_items = [
    "<b>Making Tax Digital (MTD)</b> — HMRC requires all Ltd companies to keep digital records and submit returns via MTD-compatible software (Xero, FreeAgent, QuickBooks).",
    "<b>Annual accounts</b> — Filed with Companies House and HMRC each year. Micro-entity accounts are simplified if turnover is under £632k.",
    "<b>Confirmation statement</b> — Annual filing with Companies House confirming company details. £34/year.",
    "<b>PAYE</b> — Required if you pay yourself a salary through the company. Payroll software needed (many free options available).",
    "<b>Dividends</b> — Can be taken as dividends from profits above salary, taxed at dividend rates (lower than income tax). Requires a profitable company.",
]
for item in fin_items:
    story.append(Paragraph(f"&#8226;  {item}", bullet))

# ══════════════════════════════════════════════════════════════════════════════
#  4. LEGAL & COMPLIANCE
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("4. Legal &amp; Compliance", h1))
story.append(rule())

story.append(Paragraph("UK GDPR &amp; Data Protection", h2))
story.append(Paragraph(
    "YT Transcriber collects and processes personal data (user email addresses, video history, notes, "
    "and usage data). This triggers obligations under the UK GDPR (post-Brexit version of GDPR) and "
    "the Data Protection Act 2018.", body))

gdpr_rows = [
    ["ICO Registration",            "~£40–60/year",    "Required for any business processing personal data. Register at ico.org.uk."],
    ["Privacy Policy",              "Free to draft",   "Must explain what data is collected, why, how long it is kept, and user rights."],
    ["Data Processing Agreement",   "Free",            "Required with Clerk, Stripe, and any other processor handling user data."],
    ["Lawful basis for processing", "N/A",             "Subscription = contractual necessity. Marketing = consent. Must be documented."],
    ["Right to erasure",            "N/A",             "Users can request deletion of their account and all associated data."],
    ["Data breach procedure",       "N/A",             "Must notify ICO within 72 hours of a breach affecting personal data."],
]
gd = Table(
    [[hdr("Requirement"), hdr("Cost"), hdr("Notes")]] +
    [[lbl(r[0]), cell(r[1]), sm(r[2])] for r in gdpr_rows],
    colWidths=[W*0.30, W*0.18, W*0.52]
)
gd.setStyle(TableStyle(BASE_STYLE))
story.append(gd)
story.append(Spacer(1, 8))

story.append(Paragraph("Required Legal Documents", h2))
legal_rows = [
    ["Terms of Service",            "Subscriptions, refunds, acceptable use, account termination, liability limits."],
    ["Privacy Policy",              "UK GDPR compliant. What data is collected, retention periods, user rights."],
    ["Cookie Policy",               "Required for any analytics or tracking cookies. Must allow opt-out."],
    ["Refund Policy",               "UK Consumer Rights Act 2015: right to refund for faulty digital services."],
    ["Cancellation Policy",         "Consumer Contracts Regulations 2013: 14-day cooling-off on digital subscriptions."],
    ["Acceptable Use Policy",       "Prevent misuse of the platform for bulk scraping or commercial resale of transcripts."],
]
lg = Table(
    [[hdr("Document"), hdr("Key Requirements")]] +
    [[lbl(r[0]), sm(r[1])] for r in legal_rows],
    colWidths=[W*0.32, W*0.68]
)
lg.setStyle(TableStyle(BASE_STYLE))
story.append(lg)
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Note: Legal document templates are available from services such as Rocket Lawyer UK, LawDepot, "
    "or a UK solicitor. Budget ~£200–500 for professionally reviewed documents at launch.",
    note))

story.append(Spacer(1, 8))
story.append(Paragraph("Subscription Law (UK)", h2))
sub_items = [
    "<b>Consumer Contracts Regulations 2013</b> — Customers have a 14-day right to cancel a subscription from sign-up. The free trial structure mitigates this — card is charged only after the trial ends.",
    "<b>CMA Subscription Guidance (2024)</b> — The Competition and Markets Authority issued new guidance requiring: clear pricing before sign-up, easy cancellation, and reminders before free trials convert to paid.",
    "<b>Auto-renewal disclosure</b> — Must clearly state that subscriptions auto-renew and how to cancel. Clerk's billing portal handles the cancellation mechanism.",
    "<b>Refund on cancellation</b> — No legal requirement to pro-rata refund monthly subscriptions, but best practice to do so or offer a grace period.",
]
for item in sub_items:
    story.append(Paragraph(f"&#8226;  {item}", bullet))

# ══════════════════════════════════════════════════════════════════════════════
#  5. DOMAIN & INFRASTRUCTURE
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("5. Domains &amp; Infrastructure", h1))
story.append(rule())

story.append(Paragraph("Domain Availability (checked 11 June 2026)", h2))
dom_rows = [
    ["yttranscriber.com",    "TAKEN",         "Registered Oct 2025, expires Oct 2026. Likely squatter — monitor for expiry."],
    ["yttranscriber.co.uk",  "AVAILABLE",     "Recommended primary UK domain. Register immediately."],
    ["yttranscriber.io",     "AVAILABLE",     "Recommended for tech/SaaS audience. Register now."],
    ["yttranscriber.app",    "AVAILABLE",     "Good for app positioning. Register now."],
    ["tubescript.com",       "AVAILABLE",     "Alternative brand option — clean across .com, .co.uk."],
    ["tubescript.co.uk",     "AVAILABLE",     "Pair with tubescript.com if pivoting to that name."],
    ["transcribr.com",       "TAKEN",         "On Afternic marketplace — available to buy, price unknown."],
    ["ytscript.com",         "TAKEN",         "Registered until 2034."],
    ["vidscript.com",        "TAKEN",         "On Epik marketplace — available to buy, price unknown."],
    ["vidscript.io",         "AVAILABLE",     "Alternative if rebranding."],
]
av_style = TableStyle(BASE_STYLE + [
    ("BACKGROUND", (1, r+1), (1, r+1),
     GRN_SOFT if dom_rows[r][1] == "AVAILABLE" else RED_SOFT if dom_rows[r][1] == "TAKEN" else AMB_SOFT)
    for r in range(len(dom_rows))
])
def dom_status(s):
    if s == "AVAILABLE": return Paragraph(s, status_g)
    if s == "TAKEN":     return Paragraph(s, status_r)
    return Paragraph(s, status_a)

dt = Table(
    [[hdr("Domain"), hdr("Status"), hdr("Notes")]] +
    [[lbl(r[0]), dom_status(r[1]), sm(r[2])] for r in dom_rows],
    colWidths=[W*0.30, W*0.18, W*0.52]
)
dt.setStyle(av_style)
story.append(dt)
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Recommendation: Register yttranscriber.co.uk, yttranscriber.io, and yttranscriber.app now (~£25–40 total/year). "
    "Monitor yttranscriber.com for expiry in October 2026 and attempt to register or acquire it then.",
    note))

story.append(Spacer(1, 10))
story.append(Paragraph("Infrastructure Requirements", h2))
infra_rows = [
    ["Web hosting (VPS)",        "~£15–25/mo",    "Hetzner CX22, DigitalOcean Basic, or AWS Lightsail. Single Docker container."],
    ["Domain registration",      "~£25–40/year",  "3 domains: .co.uk (~£8), .io (~£25), .app (~£12) per year approx."],
    ["SSL certificate",          "Free",          "Let's Encrypt via Certbot. Auto-renews every 90 days."],
    ["Clerk (auth + billing)",   "£0–£20/mo",     "Free up to 50k MAU. Pro plan at scale."],
    ["Stripe (via Clerk)",       "2.1% per txn",  "Clerk 0.7% + Stripe ~1.4%. No monthly fee."],
    ["Transactional email",      "Free–£10/mo",   "Clerk handles auth emails. Brevo/Mailchimp for marketing."],
    ["Uptime monitoring",        "Free",          "UptimeRobot free tier — alerts if site goes down."],
    ["Backups",                  "~£2–5/mo",      "Automated daily backups of user data and output files."],
    ["Claude API (AI chapters)", "~£0.01/use",    "Haiku model. Only charged when AI chapter feature is used."],
]
ir = Table(
    [[hdr("Item"), hdr("Est. Cost"), hdr("Notes")]] +
    [[lbl(r[0]), cell(r[1]), sm(r[2])] for r in infra_rows],
    colWidths=[W*0.30, W*0.18, W*0.52]
)
ir.setStyle(TableStyle(BASE_STYLE))
story.append(ir)

# ══════════════════════════════════════════════════════════════════════════════
#  6. PRODUCT & MARKET
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("6. Product &amp; Market", h1))
story.append(rule())

story.append(Paragraph("Product Summary", h2))
story.append(Paragraph(
    "YT Transcriber is a web-based tool that turns any YouTube video into a structured, "
    "readable document in seconds. Unlike raw YouTube captions, it groups content into proper "
    "sentences, captures timestamps, screenshots any URLs mentioned in the video, and exports "
    "everything in a professional Word document and ZIP archive.", body))

story.append(Paragraph("Key Features (current &amp; planned)", h2))
feat_rows = [
    ["Timestamped transcript",   "Live",    "Sentences grouped with clickable timestamps that seek the YouTube player."],
    ["URL screenshots",          "Live",    "Playwright captures screenshots of any URLs mentioned in the transcript."],
    ["ZIP export",               "Live",    "Download transcript (.docx), notes, links, and screenshots in one ZIP."],
    ["5 colour themes",          "Live",    "Dark, Light, Ocean, Forest, Sunset — persisted via localStorage."],
    ["Notes panel",              "Live",    "Per-video notes saved to the server."],
    ["Transcript search",        "Live",    "Filter transcript in real time."],
    ["Clerk auth + billing",     "Planned", "Email login, subscription tiers, free trial."],
    ["Collections / folders",    "Planned", "Organise saved videos into named collections."],
    ["Share links",              "Planned", "Share a read-only transcript with anyone via a link."],
    ["AI chapter markers",       "Planned", "Claude AI automatically generates chapter markers from the transcript."],
    ["Scheduled transcription",  "Planned", "Watch a channel or playlist; auto-transcribe new videos."],
    ["Transcript correction",    "Planned", "Edit and correct transcript text inline."],
]
fr = Table(
    [[hdr("Feature"), hdr("Status"), hdr("Description")]] +
    [[lbl(r[0]),
      Paragraph(r[1], status_g if r[1]=="Live" else status_a),
      sm(r[2])] for r in feat_rows],
    colWidths=[W*0.28, W*0.12, W*0.60]
)
fr.setStyle(TableStyle(BASE_STYLE))
story.append(fr)

story.append(Spacer(1, 8))
story.append(Paragraph("Target Market", h2))
market_rows = [
    ["Content creators",     "High",    "Use transcripts for repurposing YouTube content into blogs, newsletters, social posts."],
    ["Researchers / academics","High",  "Extract references, quotes, and cited URLs from educational YouTube content."],
    ["Students",             "Medium",  "Note-taking from lecture recordings and educational channels."],
    ["Journalists",          "Medium",  "Transcribe interviews, press conferences, and source videos."],
    ["Productivity users",   "Medium",  "General knowledge workers who consume and reference YouTube content."],
    ["Businesses",           "Future",  "Team workspaces — planned for Enterprise tier."],
]
mr = Table(
    [[hdr("Segment"), hdr("Priority"), hdr("Use Case")]] +
    [[lbl(r[0]),
      Paragraph(r[1], status_g if r[1]=="High" else status_a if r[1]=="Medium" else S("fp", fontSize=8.5, textColor=BLUE, fontName="Helvetica-Bold", alignment=TA_CENTER)),
      sm(r[2])] for r in market_rows],
    colWidths=[W*0.25, W*0.13, W*0.62]
)
mr.setStyle(TableStyle(BASE_STYLE))
story.append(mr)

story.append(Spacer(1, 8))
story.append(Paragraph("Competitor Landscape", h2))
comp_rows = [
    ["YouTube (built-in)",   "Free",        "Raw captions only. No export, no screenshots, no structure."],
    ["Tactiq",               "Free / £8+",  "Chrome extension only. No Word export, no URL screenshots."],
    ["Otter.ai",             "Free / £8+",  "Audio recording focus. Not YouTube-specific."],
    ["Descript",             "$12+",        "Full video editor. Heavy and expensive for transcript-only use."],
    ["NotegPT / Scribe",     "Free / paid", "Basic transcript extraction. Limited export options."],
    ["YT Transcriber",       "£7–£45/mo",   "USP: screenshots of URLs, structured Word export, collections, AI chapters."],
]
cr = Table(
    [[hdr("Product"), hdr("Pricing"), hdr("Notes vs YT Transcriber")]] +
    [[lbl(r[0]), cell(r[1]), sm(r[2])] for r in comp_rows],
    colWidths=[W*0.25, W*0.18, W*0.57]
)
cr.setStyle(TableStyle(BASE_STYLE + [
    ("BACKGROUND", (0, len(comp_rows)), (-1, len(comp_rows)), colors.HexColor("#1A1A2E")),
    ("TEXTCOLOR",  (0, len(comp_rows)), (-1, len(comp_rows)), RED),
]))
story.append(cr)

# ══════════════════════════════════════════════════════════════════════════════
#  7. REVENUE MODEL & PRICING
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("7. Revenue Model &amp; Pricing", h1))
story.append(rule())
story.append(Paragraph(
    "Revenue is generated entirely through monthly subscriptions managed via Clerk Billing (powered by Stripe). "
    "A free trial of 3 videos is available to all new users — card required upfront, one-time only. "
    "Refer to the Tier Model Proposal document for full feature-by-feature breakdowns of each model.",
    body))

story.append(Paragraph("Recommended tier model (Model C — working names):", h2))
tier_rows = [
    ["Explorer",    "Free trial",  "3 videos",      "Full Pro features during trial. Card required. One-time only."],
    ["Creator",     "£7/mo",       "15 vids/mo",    "Core transcript features. No screenshots in ZIP, no search."],
    ["Studio",      "£19/mo",      "60 vids/mo",    "All features. Intended sweet spot for most paying users."],
    ["Enterprise",  "£45/mo",      "Unlimited",     "Everything + team workspace. Future B2B expansion."],
]
tr = Table(
    [[hdr("Tier"), hdr("Price"), hdr("Credits"), hdr("Notes")]] +
    [[lbl(r[0]), cell(r[1]), cell(r[2]), sm(r[3])] for r in tier_rows],
    colWidths=[W*0.17, W*0.13, W*0.15, W*0.55]
)
tr.setStyle(TableStyle(BASE_STYLE))
story.append(tr)
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Blended ARPU estimate: £23.10/mo (20% Creator, 55% Studio, 25% Enterprise). "
    "Break-even: approximately 2 paying subscribers against fixed monthly costs.",
    note))

story.append(Spacer(1, 8))
story.append(Paragraph("Revenue Projections (Model C)", h2))
ARPU = 0.20*7 + 0.55*19 + 0.25*45
FIXED = 25.0
VAR   = 0.05
FEES  = 0.021

proj_counts = [10, 25, 50, 100, 250, 500, 1000]
proj_rows = []
for u in proj_counts:
    rev   = u * ARPU
    fixed = FIXED + max(0, ((u-1)//500)) * 25
    var   = u * VAR
    fees  = rev * FEES
    tc    = fixed + var + fees
    profit = rev - tc
    margin = profit / rev * 100
    pc = S("pc", fontSize=8, fontName="Helvetica-Bold", alignment=TA_RIGHT,
           textColor=GREEN if margin >= 50 else AMBER if margin >= 20 else RED)
    proj_rows.append([
        cell(f"{u}"),
        cell(f"£{rev:,.0f}"),
        cell(f"£{tc:,.0f}"),
        Paragraph(f"£{profit:,.0f}", pc),
        Paragraph(f"{margin:.0f}%", pc),
    ])

pt = Table(
    [[hdr("Subscribers"), hdr("Monthly Revenue"), hdr("Monthly Costs"), hdr("Net Profit"), hdr("Margin")]] +
    proj_rows,
    colWidths=[W*0.18, W*0.20, W*0.20, W*0.20, W*0.22]
)
pt.setStyle(TableStyle(BASE_STYLE))
story.append(pt)

# ══════════════════════════════════════════════════════════════════════════════
#  8. MARKETING & GROWTH
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("8. Marketing &amp; Growth", h1))
story.append(rule())

story.append(Paragraph("Brand &amp; Online Presence", h2))
brand_items = [
    "<b>Logo</b> — Created ✓. Full banner (600×120), retina (1200×240), square icon (256×256) in JPEG.",
    "<b>Colour palette</b> — Dark #0f0f0f, Red accent #E53935, Light text #e8e8e8, Muted #888.",
    "<b>Domain</b> — Register yttranscriber.co.uk, .io, .app immediately.",
    "<b>Social handles</b> — Claim @yttranscriber on X (Twitter), LinkedIn, YouTube, and TikTok before launch.",
    "<b>Google Search Console</b> — Verify domain ownership and submit sitemap at launch.",
    "<b>Google Analytics / Plausible</b> — Privacy-friendly analytics. Plausible is GDPR-compliant by default.",
]
for item in brand_items:
    story.append(Paragraph(f"&#8226;  {item}", bullet))

story.append(Spacer(1, 6))
story.append(Paragraph("Launch Channels", h2))
launch_rows = [
    ["Product Hunt",            "High",    "Launch on Product Hunt for initial spike. Target Featured status."],
    ["Reddit",                  "High",    "Post in r/productivity, r/YoutubeCreators, r/artificial, r/SideProject."],
    ["Hacker News (Show HN)",   "Medium",  "Show HN post — good for technical early adopters."],
    ["YouTube SEO",             "High",    "Target: 'YouTube transcript tool', 'download YouTube transcript', 'YouTube to Word'."],
    ["Content marketing",       "Medium",  "Blog posts: 'How to transcribe YouTube videos', 'Best YouTube transcript tools 2026'."],
    ["X / Twitter",             "Medium",  "Share launch updates, feature releases, use-case demos."],
    ["LinkedIn",                "Medium",  "Target professional users, content marketers, researchers."],
]
lr = Table(
    [[hdr("Channel"), hdr("Priority"), hdr("Notes")]] +
    [[lbl(r[0]),
      Paragraph(r[1], status_g if r[1]=="High" else status_a),
      sm(r[2])] for r in launch_rows],
    colWidths=[W*0.28, W*0.12, W*0.60]
)
lr.setStyle(TableStyle(BASE_STYLE))
story.append(lr)

# ══════════════════════════════════════════════════════════════════════════════
#  9. ACTION CHECKLIST
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("9. Action Checklist", h1))
story.append(rule())
story.append(Paragraph("Items to complete before and at launch, grouped by category.", body))

sections = [
    ("Business Setup", [
        ("Register Ltd company at Companies House (£50)", False),
        ("Set up virtual registered office address", False),
        ("Open business bank account (Tide / Starling / Monzo Business)", False),
        ("Engage accountant or set up bookkeeping software (Xero / FreeAgent)", False),
        ("Register with ICO for data protection (~£40–60/year)", False),
    ]),
    ("Domains & Hosting", [
        ("Register yttranscriber.co.uk", False),
        ("Register yttranscriber.io", False),
        ("Register yttranscriber.app", False),
        ("Set up VPS hosting (Hetzner / DigitalOcean / AWS)", False),
        ("Configure SSL certificate (Let's Encrypt)", False),
        ("Set up automated daily backups", False),
        ("Set up uptime monitoring (UptimeRobot)", False),
    ]),
    ("Legal Documents", [
        ("Draft Terms of Service", False),
        ("Draft Privacy Policy (UK GDPR compliant)", False),
        ("Draft Cookie Policy", False),
        ("Draft Refund & Cancellation Policy", False),
        ("Draft Acceptable Use Policy", False),
        ("Have legal documents reviewed by UK solicitor", False),
    ]),
    ("Product", [
        ("Integrate Clerk authentication", False),
        ("Configure Clerk subscription tiers and free trial", False),
        ("Connect Stripe account to Clerk", False),
        ("Implement feature gating by plan", False),
        ("Build collections / folders feature", False),
        ("Build share links feature", False),
        ("Final UI polish and mobile responsiveness", False),
        ("Set up transactional email (Clerk + Brevo)", False),
    ]),
    ("Launch", [
        ("Finalise pricing and tier names", False),
        ("Claim social media handles (@yttranscriber)", False),
        ("Submit sitemap to Google Search Console", False),
        ("Set up analytics (Plausible / GA4)", False),
        ("Prepare Product Hunt launch assets", False),
        ("Soft launch to test users / beta group", False),
        ("Public launch", False),
    ]),
]

for section_title, items in sections:
    story.append(KeepTogether([
        Paragraph(section_title, h2),
        Table(
            [[chk(done), lbl(text)] for text, done in items],
            colWidths=[10*mm, W - 10*mm],
            style=TableStyle([
                ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
                ("TOPPADDING",   (0,0),(-1,-1), 4),
                ("BOTTOMPADDING",(0,0),(-1,-1), 4),
                ("ROWBACKGROUNDS",(0,0),(-1,-1), [WHITE, LIGHT_BG]),
                ("GRID",         (0,0),(-1,-1), 0.3, MID_GREY),
            ])
        ),
        Spacer(1, 8),
    ]))

# ── Footer ────────────────────────────────────────────────────────────────────
story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=0.5, color=MID_GREY))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "YT Transcriber — Confidential Business Plan — Not for Distribution",
    S("Ftr", fontSize=7.5, textColor=MID_GREY, fontName="Helvetica", alignment=TA_CENTER)))

doc.build(story)
print(f"PDF saved to {OUTPUT}")
