
-- 1. Create Profiles table (tied to Supabase Auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('teacher', 'student')),
  photo_url TEXT,
  bio TEXT,
  learning_path TEXT,
  learning_path_subtitle TEXT,
  location TEXT,
  location_subtitle TEXT,
  class_status TEXT,
  class_status_subtitle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Classrooms table
CREATE TABLE classrooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Problems table (Missions)
CREATE TABLE problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('exercise', 'assignment')),
  language TEXT NOT NULL,
  instructions_url TEXT,
  starter_code TEXT,
  sample_input TEXT,
  expected_output TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_problems_due_date ON problems(due_date);

-- 4. Create Submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  output TEXT,
  status TEXT CHECK (status IN ('pending', 'correct', 'incorrect')) DEFAULT 'pending',
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Live Sessions table (Real-time code sync)
CREATE TABLE live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  code TEXT,
  language TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(classroom_id, student_id)
);

-- 6. Resources table
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enrollments table (Many-to-many relationship)
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, classroom_id)
);

-- Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- ... rest of policies ...

-- Enrollments Policies
CREATE POLICY "Users can view own enrollments." ON enrollments FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view enrollments for their classes." ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
);
CREATE POLICY "Students can enroll themselves via room code (handled by RPC or simple insert)." ON enrollments FOR INSERT WITH CHECK (student_id = auth.uid());

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Classrooms Policies
CREATE POLICY "Classrooms are viewable by everyone." ON classrooms FOR SELECT USING (true);
CREATE POLICY "Teachers can create classrooms." ON classrooms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own classrooms." ON classrooms FOR UPDATE USING (teacher_id = auth.uid());

-- Problems Policies
CREATE POLICY "Problems are viewable by participants." ON problems FOR SELECT USING (true);
CREATE POLICY "Teachers can manage problems." ON problems FOR ALL USING (
  EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
);

-- Submissions Policies
CREATE POLICY "Students can view own submissions." ON submissions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view all submissions for their classrooms." ON submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM problems p
    JOIN classrooms c ON p.classroom_id = c.id
    WHERE p.id = problem_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can submit." ON submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers can update submissions (feedback)." ON submissions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM problems p
    JOIN classrooms c ON p.classroom_id = c.id
    WHERE p.id = problem_id AND c.teacher_id = auth.uid()
  )
);

-- Live Sessions Policies
CREATE POLICY "Users can view own or their classroom's live sessions." ON live_sessions FOR SELECT USING (
  student_id = auth.uid()
  OR classroom_id IN (
    SELECT id FROM classrooms WHERE teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can update own live session." ON live_sessions FOR ALL USING (student_id = auth.uid());

-- Resources Policies
CREATE POLICY "Resources are viewable by everyone." ON resources FOR SELECT USING (true);
CREATE POLICY "Teachers can manage resources." ON resources FOR ALL USING (
  EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE classrooms;
ALTER PUBLICATION supabase_realtime ADD TABLE problems;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE resources;

-- Hub and Social Features
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  has_image BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Safe like-count mutation: runs as the function owner (SECURITY DEFINER)
-- so it can update the likes_count column without granting a general
-- UPDATE policy on posts. Only touches likes_count, nothing else.
CREATE OR REPLACE FUNCTION increment_post_likes(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_likes(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_post_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_likes(UUID) TO authenticated;

CREATE POLICY "Posts are viewable by everyone." ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts." ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update/delete own posts." ON posts FOR ALL USING (auth.uid() = author_id);

-- Likes are handled via the increment_post_likes()/decrement_post_likes() RPC
-- functions below (SECURITY DEFINER), NOT via a direct UPDATE policy — an
-- open "USING (true)" UPDATE policy would let any user rewrite any column
-- on any other user's post, not just the like count.

CREATE POLICY "Comments are viewable by everyone." ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments." ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments." ON comments FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Likes are viewable by everyone." ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle own likes." ON post_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Follows are viewable by everyone." ON follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows." ON follows FOR ALL USING (auth.uid() = follower_id);

ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 12. Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_name TEXT NOT NULL,
  actor_avatar TEXT,
  type TEXT CHECK (type IN ('like', 'comment', 'follow', 'submission', 'feedback')),
  content TEXT,
  resource_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications." ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Like/comment/follow notifications are created by the triggers below
-- (SECURITY DEFINER), not by the client, so a user can no longer insert a
-- notification claiming to be for someone else. Classroom notifications
-- (submission graded, feedback) still come from the classroom owner, so
-- INSERT is scoped to actual teacher<->student relationships instead of
-- being wide open.
CREATE POLICY "Teachers/students can notify within their own classroom." ON notifications FOR INSERT WITH CHECK (
  auth.uid() = actor_id
  AND (
    -- actor is the teacher of a classroom the recipient is enrolled in
    EXISTS (
      SELECT 1 FROM classrooms c
      JOIN enrollments e ON e.classroom_id = c.id
      WHERE c.teacher_id = auth.uid() AND e.student_id = user_id
    )
    -- or actor is a student enrolled in a classroom the recipient teaches
    OR EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classrooms c ON c.id = e.classroom_id
      WHERE e.student_id = auth.uid() AND c.teacher_id = user_id
    )
  )
);

CREATE POLICY "Users can update own notifications." ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications." ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Auto-create notifications for social actions server-side (SECURITY DEFINER
-- triggers), so the client never inserts a notification directly for likes,
-- comments, or follows — closing the forgery gap entirely for these events.
CREATE OR REPLACE FUNCTION notify_on_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_author_id UUID;
  v_actor_name TEXT;
  v_actor_avatar TEXT;
BEGIN
  SELECT author_id INTO v_author_id FROM posts WHERE id = NEW.post_id;
  IF v_author_id IS NULL OR v_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT name, photo_url INTO v_actor_name, v_actor_avatar FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, actor_id, actor_name, actor_avatar, type, resource_id)
  VALUES (v_author_id, NEW.user_id, COALESCE(v_actor_name, 'Anonymous'), v_actor_avatar, 'like', NEW.post_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_post_like
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION notify_on_post_like();

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_author_id UUID;
  v_actor_avatar TEXT;
BEGIN
  SELECT author_id INTO v_author_id FROM posts WHERE id = NEW.post_id;
  IF v_author_id IS NULL OR v_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;
  SELECT photo_url INTO v_actor_avatar FROM profiles WHERE id = NEW.author_id;
  INSERT INTO notifications (user_id, actor_id, actor_name, actor_avatar, type, content, resource_id)
  VALUES (
    v_author_id, NEW.author_id, NEW.author_name, v_actor_avatar, 'comment',
    CASE WHEN length(NEW.content) > 30 THEN substring(NEW.content from 1 for 27) || '...' ELSE NEW.content END,
    NEW.post_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_comment
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor_name TEXT;
  v_actor_avatar TEXT;
BEGIN
  SELECT name, photo_url INTO v_actor_name, v_actor_avatar FROM profiles WHERE id = NEW.follower_id;
  INSERT INTO notifications (user_id, actor_id, actor_name, actor_avatar, type)
  VALUES (NEW.following_id, NEW.follower_id, COALESCE(v_actor_name, 'Anonymous'), v_actor_avatar, 'follow');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_follow
AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ==========================================
-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (usually enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Add policies for the 'materials' bucket
-- Allow public read access to 'materials' bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'materials' );

-- Allow authenticated users to upload to 'materials' bucket
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'materials' 
  AND auth.role() = 'authenticated' 
);

-- Allow users to update/delete their own uploads in 'materials' bucket
CREATE POLICY "Owner Update/Delete Access"
ON storage.objects FOR ALL
USING ( 
  bucket_id = 'materials' 
  AND auth.uid() = owner 
);
