-- =====================================================================
-- LEVELUP — Peer Hub Reseed + Profile Differentiation
--
-- Run this AFTER your 4 demo accounts exist:
--   teacher@levelup.demo, alex@levelup.demo, priya@levelup.demo, jordan@levelup.demo
-- Safe to re-run.
-- =====================================================================

DO $$
DECLARE
  v_teacher_id UUID;
  v_alex_id UUID;
  v_priya_id UUID;
  v_jordan_id UUID;
  v_post1_id UUID;
  v_post2_id UUID;
  v_post3_id UUID;
BEGIN
  SELECT id INTO v_teacher_id FROM profiles WHERE email = 'teacher@levelup.demo';
  SELECT id INTO v_alex_id    FROM profiles WHERE email = 'alex@levelup.demo';
  SELECT id INTO v_priya_id   FROM profiles WHERE email = 'priya@levelup.demo';
  SELECT id INTO v_jordan_id  FROM profiles WHERE email = 'jordan@levelup.demo';

  IF v_teacher_id IS NULL OR v_alex_id IS NULL OR v_priya_id IS NULL OR v_jordan_id IS NULL THEN
    RAISE EXCEPTION 'One or more demo accounts not found. Sign up all 4 first.';
  END IF;

  -- -------------------------------------------------------------------
  -- Differentiate profile bio / learning path / location / class status
  -- (previously identical placeholder text across every account)
  -- -------------------------------------------------------------------
  UPDATE profiles SET
    name = 'Ms. Sarah Chen',
    bio = 'Teaching intro-to-advanced software engineering for 6 years. Believes the best debugging happens out loud.',
    learning_path = 'Software Engineering Educator',
    learning_path_subtitle = 'Curriculum design & mentorship',
    location = 'Austin, TX',
    location_subtitle = 'Hybrid classroom',
    class_status = 'Instructor',
    class_status_subtitle = '3 active classrooms'
  WHERE id = v_teacher_id;

  UPDATE profiles SET
    name = 'Alex Rivera',
    bio = 'Self-taught, third month into Python. Trying to build something real before the semester ends.',
    learning_path = 'Aspiring Backend Developer',
    learning_path_subtitle = 'Python & APIs',
    location = 'Manila, Philippines',
    location_subtitle = 'Remote learner',
    class_status = 'Active Student',
    class_status_subtitle = '2 assignments completed'
  WHERE id = v_alex_id;

  UPDATE profiles SET
    name = 'Priya Nair',
    bio = 'CS sophomore. Recursion finally clicked and I will not stop talking about it.',
    learning_path = 'Full-Stack Track',
    learning_path_subtitle = 'Data structures & web dev',
    location = 'Bengaluru, India',
    location_subtitle = 'Campus + remote',
    class_status = 'Active Student',
    class_status_subtitle = '3 assignments completed'
  WHERE id = v_priya_id;

  UPDATE profiles SET
    name = 'Jordan Kim',
    bio = 'Career switcher — ex-marketing, now chasing a junior dev role. Slow and steady.',
    learning_path = 'Career Switcher Track',
    learning_path_subtitle = 'Fundamentals first',
    location = 'Toronto, Canada',
    location_subtitle = 'Evenings & weekends',
    class_status = 'Active Student',
    class_status_subtitle = '1 assignment completed'
  WHERE id = v_jordan_id;

  -- -------------------------------------------------------------------
  -- Peer Hub: posts, comments, likes, follows
  -- -------------------------------------------------------------------
  INSERT INTO posts (author_id, author_name, content, likes_count, created_at)
  VALUES (v_alex_id, 'Alex Rivera', 'Finally got FizzBuzz working without a single if-statement typo. Small wins 🎉', 0, NOW() - INTERVAL '2 days 4 hours')
  RETURNING id INTO v_post1_id;

  INSERT INTO posts (author_id, author_name, content, likes_count, created_at)
  VALUES (v_priya_id, 'Priya Nair', 'Recursion is finally starting to click after today''s session. Base cases > magic.', 0, NOW() - INTERVAL '1 day 6 hours')
  RETURNING id INTO v_post2_id;

  INSERT INTO posts (author_id, author_name, content, likes_count, created_at)
  VALUES (v_jordan_id, 'Jordan Kim', 'Reverse a linked list, take 4. The AI hint didn''t just give me the answer, but it did stop me from rage-quitting.', 0, NOW() - INTERVAL '9 hours')
  RETURNING id INTO v_post3_id;

  INSERT INTO posts (author_id, author_name, content, likes_count, created_at)
  VALUES (v_teacher_id, 'Ms. Sarah Chen', 'Proud of Section A this week — three of you submitted working recursive solutions before I even finished writing the assignment description 👏', 0, NOW() - INTERVAL '47 minutes');

  INSERT INTO comments (post_id, author_id, author_name, content, created_at) VALUES
    (v_post1_id, v_jordan_id, 'Jordan Kim', 'Nice! I''m still debugging mine 😅', NOW() - INTERVAL '2 days 2 hours'),
    (v_post1_id, v_teacher_id, 'Ms. Sarah Chen', 'Clean condition order too — nice work.', NOW() - INTERVAL '1 day 20 hours'),
    (v_post2_id, v_alex_id, 'Alex Rivera', 'Wait until you hit mutual recursion, it''ll click even harder.', NOW() - INTERVAL '20 hours'),
    (v_post3_id, v_priya_id, 'Priya Nair', 'The hint approach is so much better than just pasting an answer in.', NOW() - INTERVAL '5 hours');

  INSERT INTO post_likes (post_id, user_id) VALUES
    (v_post1_id, v_priya_id), (v_post1_id, v_jordan_id), (v_post1_id, v_teacher_id),
    (v_post2_id, v_alex_id), (v_post2_id, v_jordan_id),
    (v_post3_id, v_priya_id);

  UPDATE posts SET likes_count = 3 WHERE id = v_post1_id;
  UPDATE posts SET likes_count = 2 WHERE id = v_post2_id;
  UPDATE posts SET likes_count = 1 WHERE id = v_post3_id;

  INSERT INTO follows (follower_id, following_id) VALUES
    (v_jordan_id, v_alex_id),
    (v_priya_id, v_alex_id),
    (v_alex_id, v_priya_id),
    (v_jordan_id, v_priya_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Peer Hub reseeded and profiles differentiated.';
END $$;
