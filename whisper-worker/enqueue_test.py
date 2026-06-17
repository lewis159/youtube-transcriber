#!/usr/bin/env python3
"""
Test-only helper: enqueue a single transcription job onto the `transcription`
BullMQ queue, exactly as the Next.js app would. Used for local Docker testing.

Usage:
    REDIS_URL=redis://host:6379 python enqueue_test.py "<youtube_url>" [videoId]
"""
import asyncio
import os
import sys

from bullmq import Queue


async def main():
    if len(sys.argv) < 2:
        print('usage: python enqueue_test.py "<youtube_url>" [videoId]')
        sys.exit(1)
    url = sys.argv[1]
    video_id = sys.argv[2] if len(sys.argv) > 2 else "test-" + os.urandom(4).hex()
    conn = os.environ.get("REDIS_URL", "redis://localhost:6379")

    q = Queue("transcription", {"connection": conn})
    job = await q.add("transcribe", {
        "videoId": video_id,
        "youtubeUrl": url,
        "userId": "test-user",
        "tier": "pro",
    })
    print(f"enqueued job id={job.id} videoId={video_id} url={url}")
    await q.close()


if __name__ == "__main__":
    asyncio.run(main())
