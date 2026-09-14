-- ============================================================
-- v5.0 Phase 3: movement-pattern classification per exercise
--
-- Drives which of the 5 generic avatar animations (squat/push/pull/
-- hinge/plank) plays for a given exercise — see
-- src/lib/avatar/animation.ts. Not a bespoke animation per exercise;
-- each is mapped to whichever pattern it most resembles.
-- ============================================================

alter table public.exercises
  add column movement_pattern text not null default 'squat' check (
    movement_pattern in ('squat', 'push', 'pull', 'hinge', 'plank')
  );

alter table public.exercises alter column movement_pattern drop default;

update public.exercises set movement_pattern = 'squat' where name = 'Bodyweight Squat';
update public.exercises set movement_pattern = 'push' where name = 'Push-up';
update public.exercises set movement_pattern = 'squat' where name = 'Walking Lunge';
update public.exercises set movement_pattern = 'plank' where name = 'Plank';
update public.exercises set movement_pattern = 'hinge' where name = 'Glute Bridge';
update public.exercises set movement_pattern = 'plank' where name = 'Mountain Climbers';
update public.exercises set movement_pattern = 'plank' where name = 'Superman Hold';
update public.exercises set movement_pattern = 'plank' where name = 'Bicycle Crunch';
update public.exercises set movement_pattern = 'push' where name = 'Tricep Dip (chair)';
update public.exercises set movement_pattern = 'squat' where name = 'Jumping Jacks';
update public.exercises set movement_pattern = 'squat' where name = 'Dumbbell Goblet Squat';
update public.exercises set movement_pattern = 'pull' where name = 'Dumbbell Row';
update public.exercises set movement_pattern = 'push' where name = 'Dumbbell Shoulder Press';
update public.exercises set movement_pattern = 'hinge' where name = 'Dumbbell Romanian Deadlift';
update public.exercises set movement_pattern = 'squat' where name = 'Barbell Back Squat';
update public.exercises set movement_pattern = 'push' where name = 'Barbell Bench Press';
update public.exercises set movement_pattern = 'pull' where name = 'Lat Pulldown Machine';
update public.exercises set movement_pattern = 'squat' where name = 'Leg Press Machine';
update public.exercises set movement_pattern = 'push' where name = 'Cable Tricep Pushdown';
update public.exercises set movement_pattern = 'pull' where name = 'Seated Cable Row';
update public.exercises set movement_pattern = 'hinge' where name = 'Kettlebell Swing';
update public.exercises set movement_pattern = 'squat' where name = 'Treadmill Interval Run';
update public.exercises set movement_pattern = 'pull' where name = 'Resistance Band Row';
update public.exercises set movement_pattern = 'squat' where name = 'Step-up (chair or bench)';
update public.exercises set movement_pattern = 'push' where name = 'Incline Dumbbell Press';
update public.exercises set movement_pattern = 'push' where name = 'Cable Chest Fly';
update public.exercises set movement_pattern = 'push' where name = 'Dumbbell Lateral Raise';
update public.exercises set movement_pattern = 'push' where name = 'Overhead Barbell Press';
update public.exercises set movement_pattern = 'pull' where name = 'Cable Face Pull';
update public.exercises set movement_pattern = 'pull' where name = 'Dumbbell Bicep Curl';
update public.exercises set movement_pattern = 'plank' where name = 'Russian Twist';
