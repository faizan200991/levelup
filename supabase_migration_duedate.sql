-- Migration: add due_date to problems
-- Run this once in the Supabase SQL Editor against your existing project.
-- Nullable so existing rows (and exercises without a deadline) stay valid.

ALTER TABLE problems ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Speeds up "assignments due soon" queries (calendar view, search/filter page)
CREATE INDEX IF NOT EXISTS idx_problems_due_date ON problems(due_date);
