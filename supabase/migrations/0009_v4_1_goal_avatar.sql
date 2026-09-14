-- ============================================================
-- v4.1 Phase 4: 3D goal-visualization avatar
--
-- Stores two independent slider sets per user: their current-state
-- sliders and a separate goal-state set, viewed side by side. This is
-- a generic character (never tied to a real photo/likeness), so the
-- stored shape is just the four numeric/enum inputs that drive the
-- procedural model — no image data.
-- ============================================================

alter table public.profiles
  add column avatar_current jsonb,
  add column avatar_goal jsonb;

comment on column public.profiles.avatar_current is
  'Current-state sliders for the goal-visualization avatar: {sex: "male"|"female", heightCm: number, muscle: 0-100, fat: 0-100}. Null until the user first saves.';
comment on column public.profiles.avatar_goal is
  'Goal-state sliders for the goal-visualization avatar, same shape as avatar_current.';
