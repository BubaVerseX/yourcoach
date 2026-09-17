-- ============================================================
-- Real exercise demonstration GIFs (WorkoutX API)
--
-- Repurposes the always-unused `video_url` column (added in the
-- initial schema, never populated or read anywhere in the app) into
-- `exercise_gif_url` -- the WorkoutX API returns an animated GIF, not
-- a video, and the column name should say so. Adds a fetched_at
-- marker so we only ever query WorkoutX once per exercise (respects
-- the 500/month free tier), same caching pattern as
-- image_fetched_at for Unsplash images.
-- ============================================================

alter table public.exercises rename column video_url to exercise_gif_url;
alter table public.exercises add column exercise_gif_fetched_at timestamptz;
