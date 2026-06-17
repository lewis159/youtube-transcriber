# Self-contained Whisper transcription worker image.
# Deps are baked in; Whisper model WEIGHTS download on first run and cache to a
# mounted volume (HF_HOME=/cache/huggingface) so they persist across restarts.
FROM python:3.11-slim

# ffmpeg is required by yt-dlp's audio postprocessor (16kHz mono WAV).
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the worker source.
COPY worker.py .

# Cache dirs (mounted as a volume in docker-compose.whisper.yml).
ENV HF_HOME=/cache/huggingface \
    WHISPER_TEMP_DIR=/cache/tmp \
    PYTHONUNBUFFERED=1
RUN mkdir -p /cache/huggingface /cache/tmp

CMD ["python", "worker.py"]
