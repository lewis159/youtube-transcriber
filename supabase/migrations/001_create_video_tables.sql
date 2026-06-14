-- Phase 3: Video and Transcript Tables
-- Created: 2026-06-14

-- Videos table - stores YouTube video metadata
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT,
  thumbnail TEXT,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Transcripts table - stores transcript data as JSONB array
-- Format: [{text: "...", start: 0.0, duration: 5.2}, ...]
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Text cache - full transcript text for searching
CREATE TABLE video_transcript_text (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at);
CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX idx_transcripts_video_id ON transcripts(video_id);
CREATE INDEX idx_video_transcript_text_video_id ON video_transcript_text(video_id);

-- Search index for transcript text
CREATE INDEX idx_video_transcript_text_search ON video_transcript_text USING gin(to_tsvector('english', text_content));
