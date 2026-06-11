"""
storage.py
----------
All data persistence lives here. Currently uses JSON files in the output/
directory — one JSON file per video. Swap this file out later for a SaaS
database (Supabase, PlanetScale, etc.) without touching anything else.
"""

import json
import os
from datetime import datetime

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")


def _video_dir(video_id: str) -> str:
    return os.path.join(OUTPUT_DIR, video_id)


def _meta_path(video_id: str) -> str:
    return os.path.join(_video_dir(video_id), "meta.json")


def save_video(data: dict) -> None:
    """Create or update a video record."""
    video_id = data["video_id"]
    os.makedirs(_video_dir(video_id), exist_ok=True)
    data["updated_at"] = datetime.utcnow().isoformat()
    with open(_meta_path(video_id), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_video(video_id: str) -> dict | None:
    """Load a video record by ID. Returns None if not found."""
    path = _meta_path(video_id)
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def list_videos() -> list[dict]:
    """Return all videos, newest first."""
    videos = []
    if not os.path.exists(OUTPUT_DIR):
        return videos
    for entry in os.scandir(OUTPUT_DIR):
        if entry.is_dir():
            meta = os.path.join(entry.path, "meta.json")
            if os.path.exists(meta):
                with open(meta, encoding="utf-8") as f:
                    videos.append(json.load(f))
    videos.sort(key=lambda v: v.get("updated_at", ""), reverse=True)
    return videos


def update_status(video_id: str, status: str, error: str = None) -> None:
    """Update just the processing status of a video."""
    data = load_video(video_id) or {"video_id": video_id}
    data["status"] = status
    if error:
        data["error"] = error
    save_video(data)


def save_notes(video_id: str, notes: str) -> None:
    """Save user notes for a video."""
    data = load_video(video_id)
    if data:
        data["notes"] = notes
        save_video(data)
