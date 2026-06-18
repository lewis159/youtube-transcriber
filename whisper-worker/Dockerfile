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

# Secrets→env bridge: loads Docker Swarm secrets from /run/secrets/* into env
# before the worker starts (backward compatible — missing files are skipped).
COPY load-secrets-entrypoint.sh /usr/local/bin/load-secrets-entrypoint.sh
RUN chmod 0555 /usr/local/bin/load-secrets-entrypoint.sh

# Cache dirs (mounted as a volume in docker-compose.whisper.yml).
ENV HF_HOME=/cache/huggingface \
    WHISPER_TEMP_DIR=/cache/tmp \
    PYTHONUNBUFFERED=1
RUN mkdir -p /cache/huggingface /cache/tmp

# Entrypoint loads secrets→env, then execs the CMD below unchanged.
ENTRYPOINT ["/usr/local/bin/load-secrets-entrypoint.sh"]
CMD ["python", "worker.py"]
