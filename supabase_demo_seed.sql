-- =====================================================================
-- LEVELUP — Demo Data Seed Script
--
-- Run this AFTER you have signed up these 4 accounts through the real
-- app (Auth requires real signup, not SQL):
--   teacher@levelup.demo   (role: teacher)
--   alex@levelup.demo      (role: student)
--   priya@levelup.demo     (role: student)
--   jordan@levelup.demo    (role: student)
--
-- If you used different emails, just find/replace them below before running.
-- Safe to re-run: each block checks it hasn't already been seeded.
-- =====================================================================

DO $$
DECLARE
  v_teacher_id UUID;
  v_alex_id UUID;
  v_priya_id UUID;
  v_jordan_id UUID;
  v_classroom_id UUID;
  v_problem1_id UUID;
  v_problem2_id UUID;
  v_problem3_id UUID;
  v_post1_id UUID;
BEGIN
  -- Look up the 4 accounts by email
  SELECT id INTO v_teacher_id FROM profiles WHERE email = 'teacher@levelup.demo';
  SELECT id INTO v_alex_id    FROM profiles WHERE email = 'alex@levelup.demo';
  SELECT id INTO v_priya_id   FROM profiles WHERE email = 'priya@levelup.demo';
  SELECT id INTO v_jordan_id  FROM profiles WHERE email = 'jordan@levelup.demo';

  IF v_teacher_id IS NULL OR v_alex_id IS NULL OR v_priya_id IS NULL OR v_jordan_id IS NULL THEN
    RAISE EXCEPTION 'One or more demo accounts not found. Sign up all 4 accounts through the app first, or edit the emails in this script.';
  END IF;

  -- Make sure roles are correct even if signup form defaulted differently
  UPDATE profiles SET role = 'teacher', name = COALESCE(NULLIF(name,'User'), 'Ms. Sarah Chen') WHERE id = v_teacher_id;
  UPDATE profiles SET role = 'student', name = COALESCE(NULLIF(name,'User'), 'Alex Rivera')   WHERE id = v_alex_id;
  UPDATE profiles SET role = 'student', name = COALESCE(NULLIF(name,'User'), 'Priya Nair')     WHERE id = v_priya_id;
  UPDATE profiles SET role = 'student', name = COALESCE(NULLIF(name,'User'), 'Jordan Kim')     WHERE id = v_jordan_id;

  -- 1. Classroom
  INSERT INTO classrooms (class_name, teacher_id, room_code)
  VALUES ('Intro to Python — Section A', v_teacher_id, 'DEMO01')
  RETURNING id INTO v_classroom_id;

  -- 2. Enroll all 3 students
  INSERT INTO enrollments (student_id, classroom_id) VALUES
    (v_alex_id, v_classroom_id),
    (v_priya_id, v_classroom_id),
    (v_jordan_id, v_classroom_id);

  -- 3. Assignments / exercises
  INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
  VALUES (
    v_classroom_id, 'FizzBuzz Basics',
    'Write a function that prints numbers 1 to 20. For multiples of 3, print "Fizz"; for multiples of 5, print "Buzz"; for multiples of both, print "FizzBuzz".',
    'exercise', 'python',
    E'def fizzbuzz(n):\n    for i in range(1, n + 1):\n        # your code here\n        pass\n\nfizzbuzz(20)',
    '20', E'1\n2\nFizz\n4\nBuzz\n...'
  ) RETURNING id INTO v_problem1_id;

  INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
  VALUES (
    v_classroom_id, 'List Comprehensions',
    'Given a list of numbers, return a new list containing only the even numbers, doubled.',
    'assignment', 'python',
    E'def double_evens(nums):\n    # your code here\n    pass\n\nprint(double_evens([1,2,3,4,5,6]))',
    '[1,2,3,4,5,6]', '[4, 8, 12]'
  ) RETURNING id INTO v_problem2_id;

  INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
  VALUES (
    v_classroom_id, 'Recursive Factorial',
    'Implement factorial(n) recursively, without using loops.',
    'assignment', 'python',
    E'def factorial(n):\n    # your code here\n    pass\n\nprint(factorial(5))',
    '5', '120'
  ) RETURNING id INTO v_problem3_id;

  -- 4. Submissions in different states, so the teacher grading UI has real variety
  INSERT INTO submissions (student_id, problem_id, code, output, status, feedback) VALUES
    (v_alex_id, v_problem1_id,
     E'def fizzbuzz(n):\n    for i in range(1, n+1):\n        if i % 15 == 0: print("FizzBuzz")\n        elif i % 3 == 0: print("Fizz")\n        elif i % 5 == 0: print("Buzz")\n        else: print(i)',
     E'1\n2\nFizz\n4\nBuzz', 'correct', 'Clean solution, good use of modulo order.'),
    (v_priya_id, v_problem1_id,
     E'def fizzbuzz(n):\n    for i in range(1, n+1):\n        if i % 3 == 0: print("Fizz")\n        elif i % 5 == 0: print("Buzz")\n        elif i % 15 == 0: print("FizzBuzz")\n        else: print(i)',
     E'1\n2\nFizz\n4\nBuzz', 'incorrect', 'Check your condition order — FizzBuzz case never gets reached since Fizz/Buzz catch it first.'),
    (v_jordan_id, v_problem2_id,
     E'def double_evens(nums):\n    return [n*2 for n in nums if n % 2 == 0]',
     '[4, 8, 12]', 'pending', NULL),
    (v_alex_id, v_problem2_id,
     E'def double_evens(nums):\n    return [n*2 for n in nums if n % 2 == 0]',
     '[4, 8, 12]', 'correct', 'Nice, textbook list comprehension.');

  -- 5. An active live coding session (so the teacher's live roster shows real activity)
  INSERT INTO live_sessions (classroom_id, student_id, problem_id, code, language)
  VALUES (
    v_classroom_id, v_jordan_id, v_problem3_id,
    E'def factorial(n):\n    if n <= 1:\n        return 1\n    # stuck here — trying to call itself\n    return n * factorial(',
    'python'
  )
  ON CONFLICT (classroom_id, student_id) DO UPDATE SET code = EXCLUDED.code, language = EXCLUDED.language;

  -- 6. Peer Hub posts, comments, likes, follows (triggers will auto-create notifications)
  INSERT INTO posts (author_id, author_name, content, likes_count)
  VALUES (v_alex_id, 'Alex Rivera', 'Finally got FizzBuzz working without a single if-statement typo. Small wins 🎉', 0)
  RETURNING id INTO v_post1_id;

  INSERT INTO posts (author_id, author_name, content, likes_count)
  VALUES (v_priya_id, 'Priya Nair', 'Recursion is finally starting to click after today''s session. Base cases > magic.', 0);

  INSERT INTO comments (post_id, author_id, author_name, content)
  VALUES (v_post1_id, v_jordan_id, 'Jordan Kim', 'Nice! I''m still debugging mine 😅');

  INSERT INTO post_likes (post_id, user_id) VALUES (v_post1_id, v_priya_id), (v_post1_id, v_jordan_id);
  UPDATE posts SET likes_count = 2 WHERE id = v_post1_id;

  INSERT INTO follows (follower_id, following_id) VALUES
    (v_jordan_id, v_alex_id),
    (v_priya_id, v_alex_id);

  RAISE NOTICE 'Demo data seeded successfully. Room code: DEMO01';
END $$;
