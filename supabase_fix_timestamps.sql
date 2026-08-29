-- =====================================================================
-- LEVELUP — Stagger Existing Submission Timestamps
--
-- Fixes the "everything shows the same timestamp" tell from the first
-- seed script (which used DEFAULT NOW() for every row in one batch).
-- Spreads submissions across the last few days instead. Safe to re-run.
-- =====================================================================

DO $$
DECLARE
  r RECORD;
  i INT := 0;
  offsets INTERVAL[] := ARRAY[
    INTERVAL '2 days 3 hours 12 minutes',
    INTERVAL '1 day 22 hours 47 minutes',
    INTERVAL '1 day 6 hours 5 minutes',
    INTERVAL '19 hours 40 minutes',
    INTERVAL '9 hours 15 minutes',
    INTERVAL '4 hours 3 minutes',
    INTERVAL '52 minutes',
    INTERVAL '11 minutes'
  ];
BEGIN
  FOR r IN
    SELECT s.id FROM submissions s
    JOIN profiles p ON p.id = s.student_id
    WHERE p.email LIKE '%@levelup.demo'
    ORDER BY s.submitted_at ASC
  LOOP
    UPDATE submissions
    SET submitted_at = NOW() - offsets[(i % array_length(offsets, 1)) + 1]
    WHERE id = r.id;
    i := i + 1;
  END LOOP;

  RAISE NOTICE 'Staggered timestamps for % submissions.', i;
END $$;
