-- Migration: 005_create_videos
-- Creates videos table with domain whitelist enforcement at app layer

CREATE TABLE IF NOT EXISTS videos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by     UUID NOT NULL REFERENCES users(id),
  title            VARCHAR(200) NOT NULL,
  url              TEXT NOT NULL,
  thumbnail_url    TEXT,
  video_type       VARCHAR(20) CHECK (video_type IN ('youtube', 'mp4', 'vimeo')),
  scope            VARCHAR(20) DEFAULT 'child_specific' CHECK (scope IN ('global', 'child_specific')),
  child_id         UUID REFERENCES child_profiles(id),
  status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
