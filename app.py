"""
app.py
------
Flask web application — routes and API endpoints.
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, send_from_directory, Response
import os

from storage import list_videos, load_video, save_notes, update_status, save_video
from processor import extract_video_id, start_processing
from exporter import build_zip

app = Flask(__name__)


# ── Pages ─────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    videos = list_videos()
    return render_template("index.html", videos=videos)


@app.route("/video/<video_id>")
def video_page(video_id):
    video = load_video(video_id)
    if not video:
        return redirect(url_for("index"))
    return render_template("video.html", video=video)


# ── API ───────────────────────────────────────────────────────────────────────

@app.route("/api/submit", methods=["POST"])
def submit():
    """Accept a YouTube URL, kick off background processing."""
    data = request.get_json()
    url = (data or {}).get("url", "").strip()

    if not url:
        return jsonify({"error": "No URL provided."}), 400

    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({"error": "Could not find a YouTube video ID in that URL."}), 400

    existing = load_video(video_id)
    if existing and existing.get("status") == "done":
        return jsonify({"video_id": video_id, "already_done": True})

    # Create a placeholder record so status polling works immediately
    save_video({
        "video_id": video_id,
        "url": url,
        "title": "Processing…",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "status": "queued",
    })

    start_processing(video_id, url)
    return jsonify({"video_id": video_id, "already_done": False})


@app.route("/api/status/<video_id>")
def status(video_id):
    """Poll processing status."""
    video = load_video(video_id)
    if not video:
        return jsonify({"status": "not_found"}), 404
    return jsonify({
        "status": video.get("status"),
        "error": video.get("error"),
        "title": video.get("title"),
    })


@app.route("/api/notes/<video_id>", methods=["POST"])
def notes(video_id):
    """Save notes for a video."""
    data = request.get_json()
    text = (data or {}).get("notes", "")
    save_notes(video_id, text)
    return jsonify({"ok": True})


@app.route("/api/export/<video_id>")
def export_zip(video_id):
    """Build and download a ZIP of transcript, screenshots, notes and links."""
    data = build_zip(video_id)
    if data is None:
        return "Video not found or still processing.", 404
    video = load_video(video_id)
    safe_title = (video.get("title", video_id) if video else video_id)[:50]
    safe_title = safe_title.replace(" ", "_").replace("/", "-")
    filename = f"{safe_title}.zip"
    return Response(
        data,
        mimetype="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.route("/output/<path:filename>")
def output_file(filename):
    """Serve screenshots and other generated files."""
    return send_from_directory(os.path.join(os.path.dirname(__file__), "output"), filename)


if __name__ == "__main__":
    os.makedirs("output", exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=True)
