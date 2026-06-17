# Whisper CPU Benchmark — OVH Box

This benchmark measures **real** local transcription speed on the OVH server so
we can pick the default Whisper model with actual numbers instead of estimates.

**Target hardware:** Intel Xeon E5-1620 v2 — 4 cores / 8 threads, 3.7 GHz,
**no AVX2**, 32 GB RAM.

---

## 1. Setup (run on the OVH box)

```bash
# Ensure ffmpeg is present (provides audio extraction/conversion)
sudo apt-get update && sudo apt-get install -y ffmpeg

# Python deps (a virtualenv is recommended)
python3 -m venv ~/whisper-bench-venv
source ~/whisper-bench-venv/bin/activate
pip install --upgrade pip
pip install faster-whisper yt-dlp

# Sanity check the tools are on PATH
ffmpeg -version | head -n 1
yt-dlp --version
```

> First run of each model downloads weights from Hugging Face (cached under
> `~/.cache/huggingface`). The **load time** printed by the script excludes the
> download only on subsequent runs — run each model once to warm the cache, then
> re-run for clean numbers.

---

## 2. Run it

```bash
# Against a YouTube URL (pick a ~5-10 min talking-head video for a quick run)
python benchmark.py "https://www.youtube.com/watch?v=XXXXXXXXXXX"

# Or against a local audio/video file
python benchmark.py /path/to/audio.mp3

# Only benchmark specific models
python benchmark.py "<url>" --models base small

# Keep the extracted WAV for re-runs (skips re-download)
python benchmark.py "<url>" --keep-audio
```

The script loops over `base`, `small`, `large-v3-turbo` with
`device="cpu"`, `compute_type="int8"`, `cpu_threads=8`. For each it prints load
time, audio duration, transcribe time, **real-time factor (RTF)**, peak RSS, and
the first 3 segments (normalised to the app schema `{text, start, duration}`) so
you can eyeball quality. A summary table is printed at the end.

**RTF = audio_duration / transcribe_time.** RTF of 2.0 means it transcribes
twice as fast as playback (a 10-min video takes 5 min). RTF below 1.0 means it is
slower than real time.

---

## 3. Fill this in after running

| Model            | RTF (xRT) | 60-min video ETA | Quality notes (from first 3 segments) |
|------------------|-----------|------------------|----------------------------------------|
| base             |           |                  |                                        |
| small            |           |                  |                                        |
| large-v3-turbo   |           |                  |                                        |

(60-min ETA is also printed by the script: `ETA for 60-min vid`.)

---

## 4. Decision rule

> **Pick the largest model whose RTF is >= ~1.0**, so the background queue keeps
> up with incoming jobs without falling behind. Prefer quality if two models are
> both comfortably above 1.0.

A model with RTF < 1.0 can still be used for a low-volume queue, but jobs will
back up faster than they clear — only acceptable if volume is low.

---

## 5. AVX2 caveat (important)

This CPU (Xeon E5-1620 v2, Ivy Bridge-EP) **lacks AVX2**. CTranslate2 (the engine
under faster-whisper) runs noticeably slower without AVX2, so **expect the lower
end** of any published estimates — possibly 1.5-3x slower than an AVX2 box.

If **all** models come back too slow (e.g. `large-v3-turbo` well under RTF 1.0
and even `small` is marginal), also try **whisper.cpp**, which has hand-tuned
SSE/AVX kernels and often performs better on older CPUs:

```bash
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp && make
./models/download-ggml-model.sh small
./main -m models/ggml-small.bin -f /path/to/audio.wav -otxt
```

Compare its wall-clock time against the faster-whisper numbers for the same model
size before committing to an engine.
