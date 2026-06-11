"""
processor.py
------------
Handles fetching video metadata and transcripts from YouTube.
Runs in a background thread so the web page doesn't time out.
"""

import re
import os
import threading
import requests
from datetime import datetime

from storage import save_video, update_status, _video_dir

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled
except ImportError:
    YouTubeTranscriptApi = None


def extract_video_id(url: str) -> str | None:
    patterns = [
        r"(?:v=|youtu\.be/|embed/|shorts/)([a-zA-Z0-9_-]{11})",
        r"^([a-zA-Z0-9_-]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_video_meta(video_id: str) -> dict:
    """Fetch title, description and thumbnail from YouTube page."""
    meta = {
        "title": video_id,
        "description": "",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
    }
    try:
        resp = requests.get(
            f"https://www.youtube.com/watch?v={video_id}",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10,
        )
        html = resp.text

        # Title
        match = re.search(r'<meta name="title" content="([^"]+)"', html)
        if not match:
            match = re.search(r'"title":"([^"\\]+)"', html)
        if match:
            import html as html_lib
            meta["title"] = html_lib.unescape(match.group(1))

        # Description
        match = re.search(r'"shortDescription":"((?:[^"\\]|\\.)*)"', html)
        if match:
            raw = match.group(1)
            raw = raw.replace("\\n", "\n").replace('\\"', '"').replace("\\\\", "\\")
            meta["description"] = raw

    except Exception:
        pass

    return meta


def format_timestamp(seconds: float) -> str:
    seconds = int(seconds)
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def group_into_sentences(snippets: list[dict]) -> list[dict]:
    sentences = []
    current_text = ""
    current_start = None

    for snippet in snippets:
        text = snippet["text"].strip().replace("\n", " ")
        if not text:
            continue
        if current_start is None:
            current_start = snippet["start"]
        current_text = (current_text + " " + text).strip() if current_text else text

        if current_text.rstrip().endswith((".", "!", "?")):
            sentences.append({"start": current_start, "text": current_text.strip()})
            current_text = ""
            current_start = None

    if current_text.strip():
        sentences.append({"start": current_start or 0, "text": current_text.strip()})

    return sentences


def extract_urls(snippets: list[dict]) -> list[dict]:
    pattern = re.compile(r'((?:https?://|www\.)[^\s\]\[<>"\']+)', re.IGNORECASE)
    found = []
    seen = set()
    for snippet in snippets:
        for match in pattern.finditer(snippet["text"]):
            url = match.group(1).rstrip(".,;)")
            if not url.startswith("http"):
                url = "https://" + url
            if url not in seen:
                seen.add(url)
                found.append({"url": url, "start": snippet["start"]})
    return found


def screenshot_url(url: str, output_path: str) -> bool:
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.goto(url, timeout=15000, wait_until="domcontentloaded")
            page.wait_for_timeout(2000)
            page.screenshot(path=output_path)
            browser.close()
        return True
    except Exception:
        return False


def process_video(video_id: str, url: str) -> None:
    """Full processing pipeline — runs in a background thread."""
    try:
        update_status(video_id, "fetching_meta")
        meta = get_video_meta(video_id)

        update_status(video_id, "fetching_transcript")
        if YouTubeTranscriptApi is None:
            raise RuntimeError("youtube-transcript-api not installed")

        api = YouTubeTranscriptApi()
        raw = api.fetch(video_id)
        snippets = [{"start": s.start, "text": s.text} for s in raw]
        sentences = group_into_sentences(snippets)
        links = extract_urls(snippets)

        # Screenshot any URLs found
        update_status(video_id, "capturing_screenshots")
        screenshots = []
        video_output_dir = _video_dir(video_id)
        for i, item in enumerate(links, 1):
            filename = f"link_{i:02d}.png"
            path = os.path.join(video_output_dir, filename)
            success = screenshot_url(item["url"], path)
            screenshots.append({
                "url": item["url"],
                "start": item["start"],
                "filename": filename if success else None,
            })

        # Save everything
        save_video({
            "video_id": video_id,
            "url": url,
            "title": meta["title"],
            "description": meta["description"],
            "thumbnail": meta["thumbnail"],
            "sentences": sentences,
            "links": links,
            "screenshots": screenshots,
            "notes": "",
            "status": "done",
            "processed_at": datetime.utcnow().isoformat(),
        })

    except (NoTranscriptFound, TranscriptsDisabled) as e:
        update_status(video_id, "error", "No transcript available for this video.")
    except Exception as e:
        update_status(video_id, "error", str(e))


def start_processing(video_id: str, url: str) -> None:
    """Kick off processing in a background thread."""
    thread = threading.Thread(target=process_video, args=(video_id, url), daemon=True)
    thread.start()
