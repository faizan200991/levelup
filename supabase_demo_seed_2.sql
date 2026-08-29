-- =====================================================================
-- LEVELUP — Additional Demo Classrooms
--
-- Adds 2 more classrooms under teacher@levelup.demo so the teacher's
-- classroom list looks like a real multi-section course load.
-- Safe to re-run: skips a classroom if its room_code already exists.
-- =====================================================================

DO $$
DECLARE
  v_teacher_id UUID;
  v_alex_id UUID;
  v_priya_id UUID;
  v_jordan_id UUID;
  v_classroom_id UUID;
  v_problem_id UUID;
BEGIN
  SELECT id INTO v_teacher_id FROM profiles WHERE email = 'teacher@levelup.demo';
  SELECT id INTO v_alex_id    FROM profiles WHERE email = 'alex@levelup.demo';
  SELECT id INTO v_priya_id   FROM profiles WHERE email = 'priya@levelup.demo';
  SELECT id INTO v_jordan_id  FROM profiles WHERE email = 'jordan@levelup.demo';

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'teacher@levelup.demo not found — run the first seed script and sign up demo accounts first.';
  END IF;

  -- ===================================================================
  -- Classroom 2: Data Structures & Algorithms
  -- ===================================================================
  IF NOT EXISTS (SELECT 1 FROM classrooms WHERE room_code = 'DEMO02') THEN
    INSERT INTO classrooms (class_name, teacher_id, room_code)
    VALUES ('Data Structures & Algorithms', v_teacher_id, 'DEMO02')
    RETURNING id INTO v_classroom_id;

    INSERT INTO enrollments (student_id, classroom_id) VALUES
      (v_priya_id, v_classroom_id),
      (v_jordan_id, v_classroom_id);

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Reverse a Linked List',
      'Given the head of a singly linked list, reverse it and return the new head.',
      'assignment', 'python',
      'class Node:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    # your code here\n    pass',
      '1 -> 2 -> 3 -> None', '3 -> 2 -> 1 -> None'
    ) RETURNING id INTO v_problem_id;

    INSERT INTO submissions (student_id, problem_id, code, output, status, feedback) VALUES
      (v_priya_id, v_problem_id,
       'def reverse_list(head):\n    prev = None\n    while head:\n        nxt = head.next\n        head.next = prev\n        prev = head\n        head = nxt\n    return prev',
       '3 -> 2 -> 1 -> None', 'correct', 'Textbook iterative reversal, well done.');

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Binary Search',
      'Implement binary search on a sorted list, returning the index of the target or -1.',
      'exercise', 'python',
      'def binary_search(arr, target):\n    # your code here\n    pass',
      '[1,3,5,7,9], target=7', '3'
    );
  END IF;

  -- ===================================================================
  -- Classroom 3: Web Development Basics
  -- ===================================================================
  IF NOT EXISTS (SELECT 1 FROM classrooms WHERE room_code = 'DEMO03') THEN
    INSERT INTO classrooms (class_name, teacher_id, room_code)
    VALUES ('Web Development Basics', v_teacher_id, 'DEMO03')
    RETURNING id INTO v_classroom_id;

    INSERT INTO enrollments (student_id, classroom_id) VALUES
      (v_alex_id, v_classroom_id),
      (v_priya_id, v_classroom_id);

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'DOM Manipulation: Todo Toggle',
      'Write a function that toggles a "completed" CSS class on a todo item when clicked.',
      'exercise', 'javascript',
      'function toggleComplete(itemEl) {\n  // your code here\n}',
      'click event on <li> element', 'toggles "completed" class'
    ) RETURNING id INTO v_problem_id;

    INSERT INTO submissions (student_id, problem_id, code, output, status, feedback) VALUES
      (v_alex_id, v_problem_id,
       'function toggleComplete(itemEl) {\n  itemEl.classList.toggle("completed");\n}',
       'class toggled correctly', 'correct', 'Simple and correct.'),
      (v_priya_id, v_problem_id,
       'function toggleComplete(itemEl) {\n  itemEl.className = "completed";\n}',
       'class always set, never removed', 'incorrect', 'This overwrites the class instead of toggling it — try classList.toggle().');

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Fetch API Basics',
      'Fetch data from a public API and render the first result''s title into the page.',
      'assignment', 'javascript',
      'async function loadData(url) {\n  // your code here\n}',
      'https://api.example.com/items', 'renders first item title'
    );
  END IF;

  RAISE NOTICE 'Additional classrooms seeded. Room codes: DEMO02, DEMO03';
END $$;
