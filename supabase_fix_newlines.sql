-- =====================================================================
-- LEVELUP — Fix Corrupted Newlines in Seeded Code
--
-- The demo seed scripts used '...\n...' string literals, which in
-- standard PostgreSQL are NOT interpreted as newlines — they store the
-- literal two characters backslash+n. This shows up as visible "\n"
-- text inside code panels instead of real line breaks.
--
-- This script replaces every literal backslash-n sequence with an
-- actual newline character in every text column that can hold code.
-- Safe to re-run (no-op if there's nothing left to fix).
-- =====================================================================

UPDATE problems
SET starter_code = replace(starter_code, '\n', chr(10))
WHERE position('\n' in starter_code) > 0;

UPDATE submissions
SET code = replace(code, '\n', chr(10))
WHERE position('\n' in code) > 0;

UPDATE live_sessions
SET code = replace(code, '\n', chr(10))
WHERE position('\n' in code) > 0;

-- =====================================================================
-- Verify with:
--   SELECT id, title FROM problems WHERE position('\n' in starter_code) > 0;
--   (should return 0 rows once fixed)
-- =====================================================================
