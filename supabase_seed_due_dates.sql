-- =====================================================================
-- LEVELUP — Due Date Test Data Seed Script
--
-- Adds 5 sample problems to ONE classroom, with due_date values spread
-- across every countdown state so you can see all the badge colors and
-- a populated calendar at once:
--   1. Overdue        (due_date in the past)               -> red "Overdue by Xh"
--   2. Urgent         (due in a few hours, < 24h)           -> red "Xh left"
--   3. Soon           (due in ~2 days, < 72h)               -> amber "Xd left"
--   4. Normal/future  (due in ~2 weeks)                     -> gray "Xd left"
--   5. No due date    (exercise with due_date left NULL)    -> no badge at all
--
-- HOW TO USE:
-- 1. Set the room code below to a real classroom's room code
--    (find it on the teacher's classroom page, top of the page / QR modal).
-- 2. Run this in the Supabase SQL Editor.
-- 3. Safe to re-run: it checks each title hasn't already been seeded
--    into that classroom before inserting it again.
-- =====================================================================

DO $$
DECLARE
  v_room_code TEXT := 'DEMO01';  -- <-- CHANGE THIS to your classroom's room code
  v_classroom_id UUID;
BEGIN
  SELECT id INTO v_classroom_id FROM classrooms WHERE room_code = v_room_code;

  IF v_classroom_id IS NULL THEN
    RAISE EXCEPTION 'No classroom found with room_code = %. Update v_room_code in this script to match a real classroom.', v_room_code;
  END IF;

  -- 1. Overdue — was due yesterday
  IF NOT EXISTS (SELECT 1 FROM problems WHERE classroom_id = v_classroom_id AND title = 'Overdue: Array Reversal') THEN
    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, due_date)
    VALUES (
      v_classroom_id, 'Overdue: Array Reversal',
      'Write a function that reverses an array in place without using a built-in reverse method.',
      'assignment', 'python',
      E'def reverse_array(arr):\n    # your code here\n    pass',
      NOW() - INTERVAL '1 day'
    );
  END IF;

  -- 2. Urgent — due in 5 hours
  IF NOT EXISTS (SELECT 1 FROM problems WHERE classroom_id = v_classroom_id AND title = 'Due Soon: Binary Search') THEN
    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, due_date)
    VALUES (
      v_classroom_id, 'Due Soon: Binary Search',
      'Implement binary search on a sorted list, returning the index of the target or -1 if not found.',
      'assignment', 'python',
      E'def binary_search(arr, target):\n    # your code here\n    pass',
      NOW() + INTERVAL '5 hours'
    );
  END IF;

  -- 3. Soon — due in 2 days
  IF NOT EXISTS (SELECT 1 FROM problems WHERE classroom_id = v_classroom_id AND title = 'Coming Up: Linked List Basics') THEN
    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, due_date)
    VALUES (
      v_classroom_id, 'Coming Up: Linked List Basics',
      'Implement a singly linked list with insert, delete, and traverse operations.',
      'assignment', 'python',
      E'class Node:\n    def __init__(self, value):\n        self.value = value\n        self.next = None',
      NOW() + INTERVAL '2 days'
    );
  END IF;

  -- 4. Future — due in 2 weeks
  IF NOT EXISTS (SELECT 1 FROM problems WHERE classroom_id = v_classroom_id AND title = 'Upcoming: Recursion Practice') THEN
    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, due_date)
    VALUES (
      v_classroom_id, 'Upcoming: Recursion Practice',
      'Write recursive functions for factorial, Fibonacci, and sum of digits.',
      'exercise', 'python',
      E'def factorial(n):\n    # your code here\n    pass',
      NOW() + INTERVAL '14 days'
    );
  END IF;

  -- 5. No due date — should show no countdown badge at all, still appears in search/list
  IF NOT EXISTS (SELECT 1 FROM problems WHERE classroom_id = v_classroom_id AND title = 'Practice: String Manipulation') THEN
    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, due_date)
    VALUES (
      v_classroom_id, 'Practice: String Manipulation',
      'Open-ended practice exercise on string slicing, formatting, and common methods. No deadline.',
      'exercise', 'python',
      E'text = "hello world"\n# your code here',
      NULL
    );
  END IF;

  RAISE NOTICE 'Seeded due-date test assignments into classroom %', v_classroom_id;
END $$;
