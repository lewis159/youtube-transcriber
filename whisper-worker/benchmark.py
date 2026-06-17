#!/usr/bin/env python3
"""
Local Whisper transcription benchmark.

Measures real transcription speed on THIS machine (intended for the OVH
Xeon E5-1620 v2 box) so we can pick a sensible default Whisper model
instead of guessing.

Depends ONLY on:
  - faster-whisper   (pip install faster-whisper)
  - yt-dlp           (pip install yt-dlp)   [only needed for URL input]
  - ffmpeg on PATH   (apt-get install ffmpeg / system package)

No app / Next.js dependencies.

Usage:
    python benchmark.py "https://www.youtube.com/watch?v=XXXX"
    python benchmark.py /path/to/local/audio.wav
    python benchmark.py /path/to/local/audio.mp3 --models base small

For each model it prints:
  - load time
  - audio duration
  - wall-clock transcribe time
  - real-time factor (RTF = audio_duration / transcribe_time; higher = faster)
  - peak RSS memory (Linux/macOS only)
  - first 3 segments normalised to the app schema {text, start, duration}
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import time
import wave

# Models to benchmark, smallest -> largest.
DEFAULT_MODELS = ["base", "small", "large-v3-turbo"]

DEVICE = "cpu"
COMPUTE_TYPE = "int8"
CPU_THREADS = 8


def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


def check_tool(name):
    """Return the resolved path for a CLI tool, or None if it is not on PATH."""
    return shutil.which(name)


def is_url(value):
    return value.startswith("http://") or value.startswith("https://")


def extract_wav_from_url(url, out_path):
    """
    Use yt-dlp to grab the bestaudio stream and pipe it through ffmpeg into a
    16kHz mono PCM WAV. We let yt-dlp call ffmpeg via its postprocessor so we
    only shell out once.
    """
    ytdlp = check_tool("yt-dlp")
    if not ytdlp:
        raise RuntimeError(
            "yt-dlp is not installed or not on PATH. Install it with:\n"
            "    pip install yt-dlp"
        )
    if not check_tool("ffmpeg"):
        raise RuntimeError(
            "ffmpeg is not installed or not on PATH. Install it with your "
            "system package manager, e.g.:\n"
            "    sudo apt-get install -y ffmpeg"
        )

    # out_path ends in .wav; yt-dlp appends the extension, so strip it for the
    # output template.
    out_template = out_path[:-4] if out_path.endswith(".wav") else out_path

    cmd = [
        ytdlp,
        "-f", "bestaudio/best",
        "--extract-audio",
        "--audio-format", "wav",
        # Force 16kHz mono PCM via ffmpeg postprocessor args.
        "--postprocessor-args", "ffmpeg:-ar 16000 -ac 1",
        "--no-playlist",
        "-o", out_template + ".%(ext)s",
        url,
    ]
    eprint("[*] Downloading + extracting audio with yt-dlp...")
    eprint("    " + " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            "yt-dlp failed (exit {}):\n{}".format(result.returncode, result.stderr)
        )
    if not os.path.exists(out_path):
        raise RuntimeError(
            "Expected WAV at {} but it was not produced. yt-dlp output:\n{}".format(
                out_path, result.stdout + result.stderr
            )
        )
    return out_path


def convert_local_to_wav(src_path, out_path):
    """Convert any local audio/video file to 16kHz mono WAV via ffmpeg."""
    if not check_tool("ffmpeg"):
        raise RuntimeError(
            "ffmpeg is not installed or not on PATH. Install it with your "
            "system package manager, e.g.:\n"
            "    sudo apt-get install -y ffmpeg"
        )
    cmd = [
        "ffmpeg", "-y",
        "-i", src_path,
        "-ar", "16000",
        "-ac", "1",
        "-vn",
        out_path,
    ]
    eprint("[*] Converting local file to 16kHz mono WAV with ffmpeg...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            "ffmpeg failed (exit {}):\n{}".format(result.returncode, result.stderr)
        )
    return out_path


def wav_duration_seconds(wav_path):
    """Read WAV duration cheaply from the header."""
    with wave.open(wav_path, "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        if rate == 0:
            return 0.0
        return frames / float(rate)


def peak_rss_mb():
    """
    Return peak resident set size in MB if cheaply available (Linux/macOS via
    the `resource` module), else None. Note: this is process-wide peak, so it
    only meaningfully reflects per-model usage if it keeps climbing.
    """
    try:
        import resource  # Linux / macOS only
    except ImportError:
        return None
    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    # ru_maxrss is kilobytes on Linux, bytes on macOS.
    if sys.platform == "darwin":
        return usage / (1024.0 * 1024.0)
    return usage / 1024.0


def normalise_segments(segments):
    """
    Convert faster-whisper segments into the app schema:
        {text, start, duration}
    `segments` is a generator; consuming it is what actually runs inference.
    """
    out = []
    for seg in segments:
        out.append({
            "text": seg.text.strip(),
            "start": round(seg.start, 3),
            "duration": round(seg.end - seg.start, 3),
        })
    return out


def benchmark_model(model_name, wav_path, audio_duration):
    from faster_whisper import WhisperModel

    print("\n" + "=" * 70)
    print("MODEL: {}".format(model_name))
    print("=" * 70)

    # --- Load (timed separately) ---
    t0 = time.perf_counter()
    model = WhisperModel(
        model_name,
        device=DEVICE,
        compute_type=COMPUTE_TYPE,
        cpu_threads=CPU_THREADS,
    )
    load_time = time.perf_counter() - t0
    print("  Load time         : {:.1f} s".format(load_time))

    # --- Transcribe (timed) ---
    t0 = time.perf_counter()
    segments_gen, info = model.transcribe(wav_path, beam_size=5)
    # faster-whisper is lazy; consuming the generator runs the work.
    segments = normalise_segments(segments_gen)
    transcribe_time = time.perf_counter() - t0

    rtf = (audio_duration / transcribe_time) if transcribe_time > 0 else 0.0
    eta_60min = (3600.0 / rtf) if rtf > 0 else float("inf")

    print("  Detected language : {} (p={:.2f})".format(
        getattr(info, "language", "?"), getattr(info, "language_probability", 0.0)))
    print("  Audio duration    : {:.1f} s ({:.1f} min)".format(
        audio_duration, audio_duration / 60.0))
    print("  Transcribe time   : {:.1f} s".format(transcribe_time))
    print("  REAL-TIME FACTOR  : {:.2f}x   (>1.0 = faster than playback)".format(rtf))
    if eta_60min == float("inf"):
        print("  ETA for 60-min vid: n/a")
    else:
        print("  ETA for 60-min vid: {:.1f} min".format(eta_60min / 60.0))
    print("  Segments          : {}".format(len(segments)))

    rss = peak_rss_mb()
    if rss is not None:
        print("  Peak RSS (proc)   : {:.0f} MB".format(rss))
    else:
        print("  Peak RSS (proc)   : n/a (resource module unavailable on this OS)")

    print("  First 3 segments (app schema {text, start, duration}):")
    for seg in segments[:3]:
        text = seg["text"]
        if len(text) > 80:
            text = text[:77] + "..."
        print("    - start={:.2f}s dur={:.2f}s text={!r}".format(
            seg["start"], seg["duration"], text))
    if not segments:
        print("    (no segments produced)")

    # Free the model before the next iteration to keep RSS readings cleaner.
    del model

    return {
        "model": model_name,
        "rtf": rtf,
        "transcribe_time": transcribe_time,
        "eta_60min_min": eta_60min / 60.0 if eta_60min != float("inf") else None,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Benchmark faster-whisper models on CPU (int8)."
    )
    parser.add_argument(
        "source",
        help="YouTube URL or path to a local audio/video file.",
    )
    parser.add_argument(
        "--models",
        nargs="+",
        default=DEFAULT_MODELS,
        help="Models to benchmark (default: {}).".format(" ".join(DEFAULT_MODELS)),
    )
    parser.add_argument(
        "--keep-audio",
        action="store_true",
        help="Do not delete the extracted temp WAV when finished.",
    )
    args = parser.parse_args()

    # Import check up front so we fail fast with a clear message.
    try:
        import faster_whisper  # noqa: F401
    except ImportError:
        eprint(
            "ERROR: faster-whisper is not installed. Install it with:\n"
            "    pip install faster-whisper"
        )
        return 2

    tmp_dir = tempfile.mkdtemp(prefix="whisper_bench_")
    wav_path = os.path.join(tmp_dir, "audio.wav")
    cleanup_wav = not args.keep_audio

    try:
        if is_url(args.source):
            extract_wav_from_url(args.source, wav_path)
        elif os.path.exists(args.source):
            if args.source.lower().endswith(".wav"):
                # Still normalise to 16kHz mono to keep things consistent.
                convert_local_to_wav(args.source, wav_path)
            else:
                convert_local_to_wav(args.source, wav_path)
        else:
            eprint("ERROR: '{}' is neither a URL nor an existing file.".format(
                args.source))
            return 2

        audio_duration = wav_duration_seconds(wav_path)
        print("\nAudio ready: {} ({:.1f}s / {:.1f} min)".format(
            wav_path, audio_duration, audio_duration / 60.0))
        print("Config: device={} compute_type={} cpu_threads={}".format(
            DEVICE, COMPUTE_TYPE, CPU_THREADS))

        results = []
        for model_name in args.models:
            try:
                results.append(benchmark_model(model_name, wav_path, audio_duration))
            except Exception as exc:  # noqa: BLE001
                eprint("  ERROR benchmarking {}: {}".format(model_name, exc))

        # --- Summary table ---
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print("{:<18} {:>8} {:>16} {:>18}".format(
            "model", "RTF", "transcribe (s)", "60-min ETA (min)"))
        print("-" * 70)
        for r in results:
            eta = "n/a" if r["eta_60min_min"] is None else "{:.1f}".format(
                r["eta_60min_min"])
            print("{:<18} {:>8.2f} {:>16.1f} {:>18}".format(
                r["model"], r["rtf"], r["transcribe_time"], eta))
        print("\nDecision rule: pick the LARGEST model whose RTF >= ~1.0 for an")
        print("acceptable background queue. If none reach ~1.0, see BENCHMARK_README.md")
        print("(consider whisper.cpp on this AVX2-less CPU).")

    finally:
        if cleanup_wav and os.path.isdir(tmp_dir):
            shutil.rmtree(tmp_dir, ignore_errors=True)
            eprint("[*] Cleaned up temp audio.")
        elif args.keep_audio:
            eprint("[*] Kept temp audio at: {}".format(wav_path))

    return 0


if __name__ == "__main__":
    sys.exit(main())
