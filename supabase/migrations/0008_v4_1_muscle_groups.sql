-- ============================================================
-- v4.1 Phase 3: fine-grained muscle-group tags per exercise
--
-- The existing `muscle_group` column is a coarse body-region bucket
-- (chest/back/legs/...) used only for workout-plan template selection.
-- These new columns are a separate, finer taxonomy (aligned to the
-- @musclemap/core MuscleGroup enum, lowercased to match this schema's
-- existing enum convention) used purely to drive the muscle-highlight
-- diagram on the exercise detail view. `primary_muscles` is normally a
-- single-element array but left as an array to allow rare compound
-- lifts with two true primaries (e.g. Superman Hold works lower back
-- and glutes about equally).
-- ============================================================

alter table public.exercises
  add column primary_muscles text[] not null default '{}',
  add column secondary_muscles text[] not null default '{}';

alter table public.exercises
  add constraint exercises_primary_muscles_valid check (
    primary_muscles <@ array[
      'chest','back_upper','back_lower','trapezius','rhomboids','lats',
      'shoulders_front','shoulders_side','shoulders_rear','biceps','triceps',
      'forearms','core','obliques','glutes','quads','hamstrings','calves',
      'hip_flexors','adductors','abductors'
    ]::text[]
  ),
  add constraint exercises_secondary_muscles_valid check (
    secondary_muscles <@ array[
      'chest','back_upper','back_lower','trapezius','rhomboids','lats',
      'shoulders_front','shoulders_side','shoulders_rear','biceps','triceps',
      'forearms','core','obliques','glutes','quads','hamstrings','calves',
      'hip_flexors','adductors','abductors'
    ]::text[]
  );

-- Backfill the existing catalog with standard exercise-science primary/
-- secondary muscle mappings (not derived from the coarse `muscle_group`
-- bucket, which is too broad for this).
update public.exercises set primary_muscles = '{quads}', secondary_muscles = '{glutes,hamstrings,back_lower,adductors}' where name = 'Barbell Back Squat';
update public.exercises set primary_muscles = '{chest}', secondary_muscles = '{triceps,shoulders_front}' where name = 'Barbell Bench Press';
update public.exercises set primary_muscles = '{core}', secondary_muscles = '{obliques,hip_flexors}' where name = 'Bicycle Crunch';
update public.exercises set primary_muscles = '{quads}', secondary_muscles = '{glutes,hamstrings,adductors,core}' where name = 'Bodyweight Squat';
update public.exercises set primary_muscles = '{chest}', secondary_muscles = '{shoulders_front}' where name = 'Cable Chest Fly';
update public.exercises set primary_muscles = '{shoulders_rear}', secondary_muscles = '{rhomboids,trapezius}' where name = 'Cable Face Pull';
update public.exercises set primary_muscles = '{triceps}', secondary_muscles = '{forearms}' where name = 'Cable Tricep Pushdown';
update public.exercises set primary_muscles = '{biceps}', secondary_muscles = '{forearms}' where name = 'Dumbbell Bicep Curl';
update public.exercises set primary_muscles = '{quads}', secondary_muscles = '{glutes,adductors,core}' where name = 'Dumbbell Goblet Squat';
update public.exercises set primary_muscles = '{shoulders_side}', secondary_muscles = '{trapezius}' where name = 'Dumbbell Lateral Raise';
update public.exercises set primary_muscles = '{hamstrings}', secondary_muscles = '{glutes,back_lower}' where name = 'Dumbbell Romanian Deadlift';
update public.exercises set primary_muscles = '{lats}', secondary_muscles = '{rhomboids,biceps,shoulders_rear}' where name = 'Dumbbell Row';
update public.exercises set primary_muscles = '{shoulders_front}', secondary_muscles = '{shoulders_side,triceps}' where name = 'Dumbbell Shoulder Press';
update public.exercises set primary_muscles = '{glutes}', secondary_muscles = '{hamstrings,core}' where name = 'Glute Bridge';
update public.exercises set primary_muscles = '{chest}', secondary_muscles = '{shoulders_front,triceps}' where name = 'Incline Dumbbell Press';
update public.exercises set primary_muscles = '{calves}', secondary_muscles = '{shoulders_side,quads}' where name = 'Jumping Jacks';
update public.exercises set primary_muscles = '{glutes}', secondary_muscles = '{hamstrings,back_lower,core}' where name = 'Kettlebell Swing';
update public.exercises set primary_muscles = '{lats}', secondary_muscles = '{biceps,rhomboids}' where name = 'Lat Pulldown Machine';
update public.exercises set primary_muscles = '{quads}', secondary_muscles = '{glutes,hamstrings}' where name = 'Leg Press Machine';
update public.exercises set primary_muscles = '{core}', secondary_muscles = '{hip_flexors,shoulders_front,quads}' where name = 'Mountain Climbers';
update public.exercises set primary_muscles = '{shoulders_front}', secondary_muscles = '{shoulders_side,triceps,core}' where name = 'Overhead Barbell Press';
update public.exercises set primary_muscles = '{core}', secondary_muscles = '{obliques,shoulders_front,glutes}' where name = 'Plank';
update public.exercises set primary_muscles = '{chest}', secondary_muscles = '{triceps,shoulders_front,core}' where name = 'Push-up';
update public.exercises set primary_muscles = '{rhomboids}', secondary_muscles = '{lats,biceps,trapezius}' where name = 'Resistance Band Row';
update public.exercises set primary_muscles = '{obliques}', secondary_muscles = '{core,hip_flexors}' where name = 'Russian Twist';
update public.exercises set primary_muscles = '{lats}', secondary_muscles = '{rhomboids,biceps,trapezius}' where name = 'Seated Cable Row';
update public.exercises set primary_muscles = '{quads}', secondary_muscles = '{glutes,hamstrings}' where name = 'Step-up (chair or bench)';
update public.exercises set primary_muscles = '{back_lower}', secondary_muscles = '{glutes,shoulders_rear}' where name = 'Superman Hold';
update public.exercises set primary_muscles = '{quads}', secondary_muscles = '{calves,hamstrings,glutes}' where name = 'Treadmill Interval Run';
update public.exercises set primary_muscles = '{triceps}', secondary_muscles = '{chest,shoulders_front}' where name = 'Tricep Dip (chair)';
update public.exercises set primary_muscles = '{quads}', secondary_muscles = '{glutes,hamstrings,adductors}' where name = 'Walking Lunge';
