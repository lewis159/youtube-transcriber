"""
exporter.py
-----------
Builds a ZIP file for a processed video containing:
  - transcript.pdf
  - screenshots/ (any PNGs captured)
  - notes.txt
  - links.txt
"""

import io
import os
import zipfile

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, HRFlowable
)
from reportlab.platypus.flowables import KeepTogether

from storage import load_video, _video_dir


def _format_timestamp(seconds: float) -> str:
    seconds = int(seconds)
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def _build_pdf(video: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "VideoTitle",
        parent=styles["Title"],
        fontSize=18,
        spaceAfter=6,
        textColor=colors.HexColor("#111111"),
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#666666"),
        spaceAfter=4,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=13,
        spaceBefore=12,
        spaceAfter=6,
        textColor=colors.HexColor("#222222"),
    )
    timestamp_style = ParagraphStyle(
        "Timestamp",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#888888"),
        spaceAfter=0,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=11,
        leading=15,
        spaceAfter=6,
    )
    link_style = ParagraphStyle(
        "Link",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#1a73e8"),
        spaceAfter=6,
    )

    story = []

    # Title
    story.append(Paragraph(video.get("title", "Transcript"), title_style))
    story.append(Paragraph(f"URL: {video.get('url', '')}", meta_style))
    story.append(Paragraph(f"Processed: {video.get('processed_at', '')[:10]}", meta_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#dddddd"), spaceAfter=10))

    # Description
    if video.get("description"):
        story.append(Paragraph("Video Description", heading_style))
        story.append(Paragraph(video["description"], body_style))

    # Transcript
    story.append(Paragraph("Transcript", heading_style))
    for sentence in video.get("sentences", []):
        ts = _format_timestamp(sentence["start"])
        block = [
            Paragraph(f"[{ts}]", timestamp_style),
            Paragraph(sentence["text"], body_style),
        ]
        story.append(KeepTogether(block))

    # Screenshots & links
    if video.get("screenshots"):
        story.append(PageBreak())
        story.append(Paragraph("Links &amp; Screenshots", heading_style))
        vdir = _video_dir(video["video_id"])
        for item in video["screenshots"]:
            ts = _format_timestamp(item["start"])
            block = [Paragraph(f"[{ts}]", timestamp_style)]
            safe_url = item["url"].replace("&", "&amp;")
            block.append(Paragraph(f'<a href="{safe_url}">{safe_url}</a>', link_style))
            if item.get("filename"):
                img_path = os.path.join(vdir, item["filename"])
                if os.path.exists(img_path):
                    try:
                        block.append(Image(img_path, width=150 * mm, kind="proportional"))
                    except Exception:
                        pass
            story.append(KeepTogether(block))
            story.append(Spacer(1, 4 * mm))

    doc.build(story)
    return buf.getvalue()


def build_zip(video_id: str) -> bytes | None:
    video = load_video(video_id)
    if not video or video.get("status") != "done":
        return None

    vdir = _video_dir(video_id)
    safe_title = video.get("title", video_id)[:60].replace("/", "-").replace("\\", "-")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:

        # transcript.pdf
        zf.writestr(f"{safe_title}/transcript.pdf", _build_pdf(video))

        # notes.txt
        notes = video.get("notes", "").strip()
        description = video.get("description", "").strip()
        notes_content = ""
        if description:
            notes_content += f"VIDEO DESCRIPTION\n{'=' * 40}\n{description}\n\n"
        if notes:
            notes_content += f"MY NOTES\n{'=' * 40}\n{notes}\n"
        if notes_content:
            zf.writestr(f"{safe_title}/notes.txt", notes_content)

        # links.txt
        links = video.get("links", [])
        if links:
            lines = [f"[{_format_timestamp(l['start'])}] {l['url']}" for l in links]
            zf.writestr(f"{safe_title}/links.txt", "\n".join(lines))

        # screenshots/
        for item in video.get("screenshots", []):
            if item.get("filename"):
                img_path = os.path.join(vdir, item["filename"])
                if os.path.exists(img_path):
                    zf.write(img_path, f"{safe_title}/screenshots/{item['filename']}")

    return buf.getvalue()
